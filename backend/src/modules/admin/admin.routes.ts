import { Router } from "express";
import { adminController } from "./admin.controller";
import { auditLogController } from "./auditLog.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";

export const adminRouter = Router();

// Every route here is admin-only.
adminRouter.use(requireAuth, requireRole("admin"));

adminRouter.get("/users", asyncHandler(adminController.listUsers));
adminRouter.patch("/users/bulk-verify", asyncHandler(adminController.bulkVerifyUsers));
adminRouter.delete("/users/bulk", asyncHandler(adminController.bulkDeleteUsers));
adminRouter.patch("/users/bulk-restore", asyncHandler(adminController.bulkRestoreUsers));
adminRouter.delete("/users/bulk-permanent", asyncHandler(adminController.bulkPermanentlyDeleteUsers));
adminRouter.get("/users/:id", asyncHandler(adminController.getUserDetail));
adminRouter.get("/users/:id/listings", asyncHandler(adminController.getUserListings));
adminRouter.patch("/users/:id/verify", asyncHandler(adminController.verifyUser));
adminRouter.delete("/users/:id", asyncHandler(adminController.deleteUser));
adminRouter.patch("/users/:id/restore", asyncHandler(adminController.restoreUser));
adminRouter.delete("/users/:id/permanent", asyncHandler(adminController.permanentlyDeleteUser));
adminRouter.get("/deleted-users", asyncHandler(adminController.listDeletedUsers));

adminRouter.delete("/posts/bulk", asyncHandler(adminController.bulkDeletePosts));
adminRouter.patch("/posts/bulk-restore", asyncHandler(adminController.bulkRestorePosts));
adminRouter.delete("/posts/bulk-permanent", asyncHandler(adminController.bulkPermanentlyDeletePosts));
adminRouter.delete("/posts/:id", asyncHandler(adminController.deletePost));
adminRouter.patch("/posts/:id/restore", asyncHandler(adminController.restorePost));
adminRouter.delete("/posts/:id/permanent", asyncHandler(adminController.permanentlyDeletePost));
adminRouter.get("/deleted-posts", asyncHandler(adminController.listDeletedPosts));

adminRouter.get("/audit-log", asyncHandler(auditLogController.list));

adminRouter.get("/analytics", asyncHandler(adminController.analytics));
