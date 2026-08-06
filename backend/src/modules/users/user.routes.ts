import { Router } from "express";
import { userController } from "./user.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { optionalAuth, requireAuth } from "../../middleware/auth";

export const userRouter = Router();

userRouter.get("/me", requireAuth, asyncHandler(userController.me));
userRouter.patch("/me", requireAuth, asyncHandler(userController.updateMe));
userRouter.patch("/me/password", requireAuth, asyncHandler(userController.changePassword));
userRouter.get("/:id", optionalAuth, asyncHandler(userController.publicProfile));
