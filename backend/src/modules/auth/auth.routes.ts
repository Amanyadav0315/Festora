import { Router } from "express";
import { authController } from "./auth.controller";
import { asyncHandler } from "../../middleware/asyncHandler";

export const authRouter = Router();

authRouter.post("/signup", asyncHandler(authController.signup));
authRouter.post("/login", asyncHandler(authController.login));
authRouter.post("/refresh", asyncHandler(authController.refresh));
authRouter.post("/logout", asyncHandler(authController.logout));
