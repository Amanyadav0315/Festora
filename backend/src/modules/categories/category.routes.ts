import { Router } from "express";
import { categoryController } from "./category.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import { uploadCategoryImage } from "../../middleware/upload";

export const categoryRouter = Router();

categoryRouter.get("/", asyncHandler(categoryController.list));
categoryRouter.patch(
  "/:id",
  requireAuth,
  requireRole("admin"),
  uploadCategoryImage.single("image"),
  asyncHandler(categoryController.update)
);