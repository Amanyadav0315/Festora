import { Router } from "express";
import { listingController } from "./listing.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";

export const listingRouter = Router();

listingRouter.get("/", asyncHandler(listingController.list));
listingRouter.post("/", requireAuth, requireRole("vendor"), asyncHandler(listingController.create));
