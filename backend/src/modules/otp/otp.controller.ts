import type { Request, Response } from "express";
import { otpService } from "./otp.service";
import { sendOtpSchema, verifyOtpSchema } from "./otp.schemas";

export const otpController = {
  async send(req: Request, res: Response) {
    const input = sendOtpSchema.parse(req.body);
    const result = await otpService.sendOtp(input);
    res.status(200).json({ message: "Verification code sent.", ...result });
  },

  async verify(req: Request, res: Response) {
    const input = verifyOtpSchema.parse(req.body);
    await otpService.verifyOtp(input);
    res.status(200).json({ verified: true });
  },
};
