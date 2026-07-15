import { Router } from "express";
import { storeController } from "./store.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";

export const storeRouter = Router();

storeRouter.post("/", requireAuth, requireRole("vendor"), asyncHandler(storeController.create));
storeRouter.get("/me", requireAuth, requireRole("vendor"), asyncHandler(storeController.myStore));
