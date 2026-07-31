import { Router } from "express";
import { storeController } from "./store.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";

export const storeRouter = Router();

storeRouter.post("/", requireAuth, asyncHandler(storeController.create));
storeRouter.get("/me", requireAuth, asyncHandler(storeController.myStore));
storeRouter.get("/by-owner/:userId", asyncHandler(storeController.getByOwner));
storeRouter.get("/:id", asyncHandler(storeController.getById));
