import { Router } from "express";
import { reviewController } from "./review.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";

export const reviewRouter = Router();

reviewRouter.get("/:userId", asyncHandler(reviewController.list));
reviewRouter.put("/:userId", requireAuth, asyncHandler(reviewController.write));
reviewRouter.delete("/:userId", requireAuth, asyncHandler(reviewController.remove));
