import { Router } from "express";
import { otpController } from "./otp.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { authLimiter } from "../../middleware/rateLimit";

export const otpRouter = Router();

// Rate-limited like login/signup — these endpoints are exactly what an email-bombing or
// account-enumeration script would target.
otpRouter.post("/send", authLimiter, asyncHandler(otpController.send));
otpRouter.post("/verify", authLimiter, asyncHandler(otpController.verify));
