import { Router } from "express";
import { socialController } from "./social.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import { uploadReportImages } from "../../middleware/upload";

export const socialRouter = Router();

socialRouter.post("/follow/:id", requireAuth, asyncHandler(socialController.follow));
socialRouter.delete("/follow/:id", requireAuth, asyncHandler(socialController.unfollow));
socialRouter.get("/followers/:id", requireAuth, asyncHandler(socialController.followers));
socialRouter.delete("/followers/:id", requireAuth, asyncHandler(socialController.removeFollower));
socialRouter.get("/following/:id", requireAuth, asyncHandler(socialController.following));
socialRouter.post("/block/:id", requireAuth, asyncHandler(socialController.block));
socialRouter.delete("/block/:id", requireAuth, asyncHandler(socialController.unblock));
socialRouter.post(
  "/report/:id",
  requireAuth,
  uploadReportImages.array("screenshots", 4),
  asyncHandler(socialController.report)
);

// Admin-only review queue.
socialRouter.get("/admin/reports", requireAuth, requireRole("admin"), asyncHandler(socialController.listReports));
socialRouter.get(
  "/admin/reports-count",
  requireAuth,
  requireRole("admin"),
  asyncHandler(socialController.countPendingReports)
);
socialRouter.patch(
  "/admin/reports/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(socialController.reviewReport)
);
socialRouter.patch(
  "/admin/reports/:id/resolve",
  requireAuth,
  requireRole("admin"),
  asyncHandler(socialController.resolveReport)
);
socialRouter.delete(
  "/admin/reports/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(socialController.deleteReport)
);
