import { Router } from "express";
import { adminController } from "./admin.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";

export const adminRouter = Router();

// Every route here is admin-only.
adminRouter.use(requireAuth, requireRole("admin"));

adminRouter.get("/users", asyncHandler(adminController.listUsers));
adminRouter.get("/users/:id", asyncHandler(adminController.getUserDetail));
adminRouter.get("/users/:id/listings", asyncHandler(adminController.getUserListings));
adminRouter.delete("/users/:id", asyncHandler(adminController.deleteUser));
adminRouter.patch("/users/:id/restore", asyncHandler(adminController.restoreUser));
adminRouter.delete("/users/:id/permanent", asyncHandler(adminController.permanentlyDeleteUser));
adminRouter.get("/deleted-users", asyncHandler(adminController.listDeletedUsers));

adminRouter.delete("/posts/:id", asyncHandler(adminController.deletePost));
adminRouter.patch("/posts/:id/restore", asyncHandler(adminController.restorePost));
adminRouter.delete("/posts/:id/permanent", asyncHandler(adminController.permanentlyDeletePost));
adminRouter.get("/deleted-posts", asyncHandler(adminController.listDeletedPosts));
