import { z } from "zod";

const PHONE_REGEX = /^[6-9]\d{9}$/;

export const signupSchema = z.object({
  name: z.string({ required_error: "Please enter your name" }).min(2, "Name is too short").max(100, "Name is too long"),
  phone: z
    .string({ required_error: "Please enter your phone number" })
    .regex(PHONE_REGEX, "Please enter a valid 10-digit phone number"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  password: z
    .string({ required_error: "Please enter a password" })
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password is too long"),
});

export const loginSchema = z.object({
  identifier: z.string({ required_error: "Please enter your phone number or email" }).min(3, "Please enter your phone number or email"),
  password: z.string({ required_error: "Please enter your password" }).min(1, "Please enter your password"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
