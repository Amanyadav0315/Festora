import { Router } from "express";
import { storeController } from "./store.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";

export const storeRouter = Router();

storeRouter.post("/", requireAuth, asyncHandler(storeController.create));
storeRouter.get("/me", requireAuth, asyncHandler(storeController.myStore));
