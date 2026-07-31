import { Router } from "express";
import { socialController } from "./social.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";

export const socialRouter = Router();

socialRouter.post("/follow/:id", requireAuth, asyncHandler(socialController.follow));
socialRouter.delete("/follow/:id", requireAuth, asyncHandler(socialController.unfollow));
socialRouter.get("/followers/:id", asyncHandler(socialController.followers));
socialRouter.get("/following/:id", asyncHandler(socialController.following));
socialRouter.post("/block/:id", requireAuth, asyncHandler(socialController.block));
socialRouter.delete("/block/:id", requireAuth, asyncHandler(socialController.unblock));
socialRouter.post("/report/:id", requireAuth, asyncHandler(socialController.report));
