import { z } from "zod";
import { CATEGORY_SLUGS } from "@festora/types";

export const createStoreSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(2000).optional(),
  categories: z.array(z.enum(CATEGORY_SLUGS)).min(1),
  city: z.string().max(100).optional(),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
