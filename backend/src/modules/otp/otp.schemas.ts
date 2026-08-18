import { z } from "zod";

export const otpPurposeSchema = z.enum(["signup", "reset", "email-change"]);

export const sendOtpSchema = z.object({
  email: z.string({ required_error: "Please enter your email address" }).email("Please enter a valid email address"),
  purpose: otpPurposeSchema.default("signup"),
});

export const verifyOtpSchema = z.object({
  email: z.string({ required_error: "Please enter your email address" }).email("Please enter a valid email address"),
  code: z
    .string({ required_error: "Please enter the code" })
    .length(6, "The code must be 6 digits")
    .regex(/^\d{6}$/, "The code must be 6 digits"),
  purpose: otpPurposeSchema.default("signup"),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
