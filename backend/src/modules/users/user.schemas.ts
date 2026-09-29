import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  about: z.string().max(200).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Please enter your current password"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Please enter your password"),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

export const updatePhoneVisibilitySchema = z.object({
  showPhonePublicly: z.boolean(),
});

export type UpdatePhoneVisibilityInput = z.infer<typeof updatePhoneVisibilitySchema>;

// Email/phone can't go through the plain profile PATCH — each change is verified with an OTP.
const emailField = z.string({ required_error: "Please enter your email address" }).email("Please enter a valid email address");
const phoneField = z
  .string({ required_error: "Please enter your phone number" })
  .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number");
const codeField = z
  .string({ required_error: "Please enter the code" })
  .regex(/^\d{6}$/, "The code must be 6 digits");

export const requestEmailChangeSchema = z.object({
  newEmail: emailField,
  password: z.string().min(1, "Please enter your password"),
});
export const confirmEmailChangeSchema = z.object({ newEmail: emailField, code: codeField });
export const requestPhoneChangeSchema = z.object({
  newPhone: phoneField,
  password: z.string().min(1, "Please enter your password"),
});
export const confirmPhoneChangeSchema = z.object({ newPhone: phoneField, code: codeField });
