import type { Request, Response } from "express";
import { FollowModel } from "./follow.model";
import { BlockModel } from "./block.model";
import { ReportModel } from "./report.model";
import { UserModel } from "../users/user.model";
import { reportUserSchema } from "./social.schemas";
import { ApiError } from "../../middleware/errorHandler";

function toSummary(u: any) {
  return { id: u._id.toString(), name: u.name };
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

  async followers(req: Request, res: Response) {
    const follows = await FollowModel.find({ followingId: req.params.id }).populate("followerId", "name");
    res.json({ users: follows.map((f) => toSummary(f.followerId)) });
  },

  async following(req: Request, res: Response) {
    const follows = await FollowModel.find({ followerId: req.params.id }).populate("followingId", "name");
    res.json({ users: follows.map((f) => toSummary(f.followingId)) });
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

    await ReportModel.create({ reporterId: req.user!.sub, reportedId: targetId, reason: input.reason });
    res.status(201).json({ reported: true });
  },
};
