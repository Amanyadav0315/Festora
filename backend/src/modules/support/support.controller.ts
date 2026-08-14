import type { Request, Response } from "express";
import { IssueReportModel } from "./issueReport.model";
import { issueReportSchema } from "./support.schemas";
import { reportImageUrl } from "../../middleware/upload";
import { ApiError } from "../../middleware/errorHandler";

function toSummary(u: any) {
  if (!u || typeof u !== "object") return { id: String(u), name: "Deleted user" };
  return { id: u._id.toString(), name: u.name };
}

function toIssueReportDTO(r: any) {
  return {
    id: r._id.toString(),
    reporter: toSummary(r.reporterId),
    message: r.message,
    screenshots: r.screenshots ?? [],
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  };
}

export const supportController = {
  // POST /support/issues — any signed-in user reporting a bug/problem with the app itself.
  async submitIssue(req: Request, res: Response) {
    const input = issueReportSchema.parse(req.body);
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const screenshots = files.map((f) => reportImageUrl(f.filename));

    await IssueReportModel.create({
      reporterId: req.user!.sub,
      message: input.message,
      screenshots,
    });
    res.status(201).json({ reported: true });
  },

  // GET /support/admin/issues?status=pending — admin-only review queue.
  async listIssues(req: Request, res: Response) {
    const filter: Record<string, unknown> = {};
    if (req.query.status === "pending" || req.query.status === "reviewed") filter.status = req.query.status;

    const issues = await IssueReportModel.find(filter).sort({ createdAt: -1 }).populate("reporterId", "name");
    res.json({ issues: issues.map(toIssueReportDTO) });
  },

  // PATCH /support/admin/issues/:id — mark an issue reviewed.
  async reviewIssue(req: Request, res: Response) {
    const issue = await IssueReportModel.findById(req.params.id);
    if (!issue) throw new ApiError(404, "Issue report not found");
    issue.status = "reviewed";
    await issue.save();
    res.json({ reviewed: true });
  },

  // DELETE /support/admin/issues/:id — permanently remove an issue report from the queue.
  async deleteIssue(req: Request, res: Response) {
    const issue = await IssueReportModel.findByIdAndDelete(req.params.id);
    if (!issue) throw new ApiError(404, "Issue report not found");
    res.status(204).send();
  },

  // GET /support/admin/issues-count — pending count, used for the admin sidebar badge.
  async countPendingIssues(req: Request, res: Response) {
    const count = await IssueReportModel.countDocuments({ status: "pending" });
    res.json({ count });
  },
};
