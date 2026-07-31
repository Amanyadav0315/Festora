import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
