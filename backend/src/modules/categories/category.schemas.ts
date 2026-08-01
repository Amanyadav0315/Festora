import { z } from "zod";

const isMainCoerce = z
  .union([z.boolean(), z.string()])
  .transform((v) => v === true || v === "true")
  .optional();

export const createCategorySchema = z.object({
  name: z.string().min(2).max(80),
  nameHi: z.string().max(80).optional(),
  slug: z.string().min(2).max(100).optional(),
  description: z.string().max(300).optional(),
  descriptionHi: z.string().max(300).optional(),
  icon: z.string().max(10).optional(),
  isMain: isMainCoerce,
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(80).optional(),
  nameHi: z.string().max(80).optional(),
  description: z.string().max(300).optional(),
  descriptionHi: z.string().max(300).optional(),
  icon: z.string().max(10).optional(),
  isMain: isMainCoerce,
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
