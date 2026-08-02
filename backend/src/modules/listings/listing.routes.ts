import { Router } from "express";
import { listingController } from "./listing.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { optionalAuth, requireAuth } from "../../middleware/auth";
import { uploadListingImages } from "../../middleware/upload";

export const listingRouter = Router();

listingRouter.get("/", optionalAuth, asyncHandler(listingController.list));
listingRouter.get("/:id", asyncHandler(listingController.getOne));
listingRouter.post("/", requireAuth, uploadListingImages.array("images", 6), asyncHandler(listingController.create));
listingRouter.patch("/:id", requireAuth, uploadListingImages.array("images", 6), asyncHandler(listingController.update));
listingRouter.delete("/:id", requireAuth, asyncHandler(listingController.remove));
