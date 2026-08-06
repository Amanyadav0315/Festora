import type { Request, Response } from "express";
import { FollowModel } from "./follow.model";
import { BlockModel } from "./block.model";
import { ReportModel } from "./report.model";
import { UserModel } from "../users/user.model";
import { reportUserSchema } from "./social.schemas";
import { reportImageUrl } from "../../middleware/upload";
import { ApiError } from "../../middleware/errorHandler";

function toSummary(u: any) {
  return { id: u._id.toString(), name: u.name };
}

// A populated ref can come back null if the referenced user was deleted after the edge was
// created (a dangling follow/report record) — fall back to a placeholder instead of crashing.
function toSummaryOrUnknown(u: any, rawId: unknown) {
  if (u && typeof u === "object") return toSummary(u);
  return { id: String(rawId), name: "Deleted user" };
}

function toReportDTO(r: any) {
  return {
    id: r._id.toString(),
    reporter: toSummaryOrUnknown(r.reporterId, r.reporterId?._id ?? r.reporterId),
    reported: toSummaryOrUnknown(r.reportedId, r.reportedId?._id ?? r.reportedId),
    reason: r.reason,
    screenshots: (r.screenshots ?? []).map((f: string) => f),
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  };
}

export const socialController = {
  async follow(req: Request, res: Response) {
    const targetId = req.params.id;
    if (targetId === req.user!.sub) throw new ApiError(400, "You cannot follow yourself");
    const target = await UserModel.findById(targetId);
    if (!target) throw new ApiError(404, "User not found");

    await FollowModel.updateOne(
      { followerId: req.user!.sub, followingId: targetId },
      { $setOnInsert: { followerId: req.user!.sub, followingId: targetId } },
      { upsert: true }
    );
    res.status(201).json({ following: true });
  },

  async unfollow(req: Request, res: Response) {
    await FollowModel.deleteOne({ followerId: req.user!.sub, followingId: req.params.id });
    res.json({ following: false });
  },

  async removeFollower(req: Request, res: Response) {
    // Removing a follower is the mirror of unfollow: delete the edge where :id follows me,
    // rather than where I follow :id.
    await FollowModel.deleteOne({ followerId: req.params.id, followingId: req.user!.sub });
    res.json({ removed: true });
  },

  async followers(req: Request, res: Response) {
    // Followers/following lists are private — only the account owner can view their own.
    if (req.params.id !== req.user!.sub) throw new ApiError(403, "You can only view your own followers");
    const follows = await FollowModel.find({ followingId: req.params.id }).populate("followerId", "name");
    // A follower account may have been deleted after the edge was created — skip those
    // dangling rows instead of crashing on a null populated ref.
    res.json({ users: follows.filter((f) => f.followerId).map((f) => toSummary(f.followerId)) });
  },

  async following(req: Request, res: Response) {
    if (req.params.id !== req.user!.sub) throw new ApiError(403, "You can only view who you follow");
    const follows = await FollowModel.find({ followerId: req.params.id }).populate("followingId", "name");
    res.json({ users: follows.filter((f) => f.followingId).map((f) => toSummary(f.followingId)) });
  },

  async block(req: Request, res: Response) {
    const targetId = req.params.id;
    if (targetId === req.user!.sub) throw new ApiError(400, "You cannot block yourself");
    const target = await UserModel.findById(targetId);
    if (!target) throw new ApiError(404, "User not found");

    await BlockModel.updateOne(
      { blockerId: req.user!.sub, blockedId: targetId },
      { $setOnInsert: { blockerId: req.user!.sub, blockedId: targetId } },
      { upsert: true }
    );
    await FollowModel.deleteMany({
      $or: [
        { followerId: req.user!.sub, followingId: targetId },
        { followerId: targetId, followingId: req.user!.sub },
      ],
    });
    res.status(201).json({ blocked: true });
  },

  async unblock(req: Request, res: Response) {
    await BlockModel.deleteOne({ blockerId: req.user!.sub, blockedId: req.params.id });
    res.json({ blocked: false });
  },

  async report(req: Request, res: Response) {
    const targetId = req.params.id;
    if (targetId === req.user!.sub) throw new ApiError(400, "You cannot report yourself");
    const input = reportUserSchema.parse(req.body);
    const target = await UserModel.findById(targetId);
    if (!target) throw new ApiError(404, "User not found");

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const screenshots = files.map((f) => reportImageUrl(f.filename));

    await ReportModel.create({
      reporterId: req.user!.sub,
      reportedId: targetId,
      reason: input.reason,
      screenshots,
      conversationId: input.conversationId || undefined,
    });
    res.status(201).json({ reported: true });
  },

  // GET /social/admin/reports?status=pending — admin-only review queue.
  async listReports(req: Request, res: Response) {
    const filter: Record<string, unknown> = {};
    if (req.query.status === "pending" || req.query.status === "reviewed") filter.status = req.query.status;

    const reports = await ReportModel.find(filter)
      .sort({ createdAt: -1 })
      .populate("reporterId", "name")
      .populate("reportedId", "name");
    res.json({ reports: reports.map(toReportDTO) });
  },

  // PATCH /social/admin/reports/:id — mark a report reviewed.
  async reviewReport(req: Request, res: Response) {
    const report = await ReportModel.findById(req.params.id);
    if (!report) throw new ApiError(404, "Report not found");
    report.status = "reviewed";
    await report.save();
    res.json({ reviewed: true });
  },
};
