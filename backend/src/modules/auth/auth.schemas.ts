import { z } from "zod";

const PHONE_REGEX = /^[6-9]\d{9}$/;

export const signupSchema = z.object({
  name: z.string({ required_error: "Please enter your name" }).min(2, "Name is too short").max(100, "Name is too long"),
  businessName: z
    .string({ required_error: "Please enter your business name" })
    .min(2, "Business name is too short")
    .max(100, "Business name is too long"),
  phone: z
    .string({ required_error: "Please enter your phone number" })
    .regex(PHONE_REGEX, "Please enter a valid 10-digit phone number"),
  // Required — an email is needed to send the signup verification OTP and to support
  // password-reset later. Enforced here, not just in the UI.
  email: z
    .string({ required_error: "Please enter your email address" })
    .email("Please enter a valid email address"),
  password: z
    .string({ required_error: "Please enter a password" })
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password is too long"),
  // Enforced server-side, not just in the UI — a real signup must not be possible without
  // explicitly agreeing to both documents, regardless of what the client sends.
  acceptedTerms: z
    .boolean({ required_error: "You must accept the Privacy Policy and Terms & Conditions" })
    .refine((v) => v === true, "You must accept the Privacy Policy and Terms & Conditions"),
});

export const loginSchema = z.object({
  identifier: z.string({ required_error: "Please enter your phone number or email" }).min(3, "Please enter your phone number or email"),
  password: z.string({ required_error: "Please enter your password" }).min(1, "Please enter your password"),
});

export const resetPasswordSchema = z.object({
  email: z.string({ required_error: "Please enter your email address" }).email("Please enter a valid email address"),
  code: z
    .string({ required_error: "Please enter the code" })
    .length(6, "The code must be 6 digits")
    .regex(/^\d{6}$/, "The code must be 6 digits"),
  newPassword: z
    .string({ required_error: "Please enter a new password" })
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password is too long"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
