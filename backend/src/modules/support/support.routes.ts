import { Router } from "express";
import { supportController } from "./support.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import { uploadReportImages } from "../../middleware/upload";

export const supportRouter = Router();

supportRouter.post(
  "/issues",
  requireAuth,
  uploadReportImages.array("screenshots", 4),
  asyncHandler(supportController.submitIssue)
);

supportRouter.get("/admin/issues", requireAuth, requireRole("admin"), asyncHandler(supportController.listIssues));
supportRouter.get(
  "/admin/issues-count",
  requireAuth,
  requireRole("admin"),
  asyncHandler(supportController.countPendingIssues)
);
supportRouter.patch(
  "/admin/issues/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(supportController.reviewIssue)
);
supportRouter.delete(
  "/admin/issues/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(supportController.deleteIssue)
);
