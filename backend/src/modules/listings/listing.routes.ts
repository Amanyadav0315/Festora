import { Router } from "express";
import { listingController } from "./listing.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";

export const listingRouter = Router();

listingRouter.get("/", asyncHandler(listingController.list));
listingRouter.post("/", requireAuth, asyncHandler(listingController.create));
