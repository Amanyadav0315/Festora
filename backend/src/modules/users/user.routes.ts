import { Router } from "express";
import { userController } from "./user.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { optionalAuth, requireAuth } from "../../middleware/auth";
import { uploadAvatar } from "../../middleware/upload";

export const userRouter = Router();

userRouter.get("/me", requireAuth, asyncHandler(userController.me));
userRouter.patch("/me", requireAuth, asyncHandler(userController.updateMe));
userRouter.patch("/me/avatar", requireAuth, uploadAvatar.single("avatar"), asyncHandler(userController.updateAvatar));
userRouter.patch("/me/password", requireAuth, asyncHandler(userController.changePassword));
userRouter.delete("/me", requireAuth, asyncHandler(userController.deleteMe));
userRouter.get("/:id", optionalAuth, asyncHandler(userController.publicProfile));
