import { z } from "zod";

const PHONE_REGEX = /^[6-9]\d{9}$/;

export const signupSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(PHONE_REGEX, "Enter a valid 10-digit phone number"),
  email: z.string().email().optional(),
  password: z.string().min(6).max(72),
  role: z.enum(["buyer", "vendor"]).default("buyer"),
});

export const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
