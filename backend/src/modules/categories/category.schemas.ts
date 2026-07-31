import { z } from "zod";

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(300).optional(),
  icon: z.string().max(10).optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
