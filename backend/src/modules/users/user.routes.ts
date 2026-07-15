import { Router } from "express";
import { userController } from "./user.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";

export const userRouter = Router();

userRouter.get("/me", requireAuth, asyncHandler(userController.me));
