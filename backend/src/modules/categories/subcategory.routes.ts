import { Router } from "express";
import { subcategoryController } from "./subcategory.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import { uploadCategoryImage } from "../../middleware/upload";

export const subcategoryRouter = Router();

subcategoryRouter.get("/", asyncHandler(subcategoryController.list));
subcategoryRouter.post(
  "/",
  requireAuth,
  requireRole("admin"),
  uploadCategoryImage.single("image"),
  asyncHandler(subcategoryController.create)
);
subcategoryRouter.patch(
  "/:id",
  requireAuth,
  requireRole("admin"),
  uploadCategoryImage.single("image"),
  asyncHandler(subcategoryController.update)
);
subcategoryRouter.delete("/:id", requireAuth, requireRole("admin"), asyncHandler(subcategoryController.remove));