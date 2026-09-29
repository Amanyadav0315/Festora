import { Router } from "express";
import { userController } from "./user.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { optionalAuth, requireAuth } from "../../middleware/auth";
import { authLimiter } from "../../middleware/rateLimit";
import { uploadAvatar } from "../../middleware/upload";

export const userRouter = Router();

userRouter.get("/me", requireAuth, asyncHandler(userController.me));
userRouter.patch("/me", requireAuth, asyncHandler(userController.updateMe));
userRouter.patch("/me/avatar", requireAuth, uploadAvatar.single("avatar"), asyncHandler(userController.updateAvatar));
userRouter.delete("/me/avatar", requireAuth, asyncHandler(userController.removeAvatar));
userRouter.patch("/me/password", requireAuth, asyncHandler(userController.changePassword));
userRouter.patch("/me/phone-visibility", requireAuth, asyncHandler(userController.updatePhoneVisibility));
userRouter.post("/me/email/request", requireAuth, authLimiter, asyncHandler(userController.requestEmailChange));
userRouter.patch("/me/email", requireAuth, authLimiter, asyncHandler(userController.confirmEmailChange));
userRouter.post("/me/phone/request", requireAuth, authLimiter, asyncHandler(userController.requestPhoneChange));
userRouter.patch("/me/phone", requireAuth, authLimiter, asyncHandler(userController.confirmPhoneChange));
userRouter.delete("/me", requireAuth, asyncHandler(userController.deleteMe));
userRouter.get("/:id", optionalAuth, asyncHandler(userController.publicProfile));
