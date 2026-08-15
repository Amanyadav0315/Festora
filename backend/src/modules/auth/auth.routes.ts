import { Router } from "express";
import { authController } from "./auth.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { authLimiter } from "../../middleware/rateLimit";

export const authRouter = Router();

// Rate-limited: these are the endpoints a credential-stuffing or fake-account script would
// hammer. /refresh and /logout are left unlimited (they run silently on every page load).
authRouter.post("/signup", authLimiter, asyncHandler(authController.signup));
authRouter.post("/login", authLimiter, asyncHandler(authController.login));
authRouter.post("/refresh", asyncHandler(authController.refresh));
authRouter.post("/logout", asyncHandler(authController.logout));
