import { z } from "zod";

export const createStoreSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(2000).optional(),
  categories: z.array(z.string().min(1)).min(1),
  city: z.string().max(100).optional(),
});

export const updateAvailabilitySchema = z.object({
  unavailableDates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Dates must be in YYYY-MM-DD format"))
    .max(365),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
