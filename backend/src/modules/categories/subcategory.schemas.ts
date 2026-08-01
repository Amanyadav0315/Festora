import { z } from "zod";

const featuredCoerce = z
  .union([z.boolean(), z.string()])
  .transform((v) => v === true || v === "true")
  .optional();

export const createSubcategorySchema = z.object({
  name: z.string().min(2).max(80),
  nameHi: z.string().max(80).optional(),
  slug: z.string().min(2).max(100).optional(),
  categorySlug: z.string().min(1),
  description: z.string().max(300).optional(),
  icon: z.string().max(10).optional(),
  featured: featuredCoerce,
});

export const updateSubcategorySchema = z.object({
  name: z.string().min(2).max(80).optional(),
  nameHi: z.string().max(80).optional(),
  categorySlug: z.string().min(1).optional(),
  description: z.string().max(300).optional(),
  icon: z.string().max(10).optional(),
  featured: featuredCoerce,
});

export type CreateSubcategoryInput = z.infer<typeof createSubcategorySchema>;
export type UpdateSubcategoryInput = z.infer<typeof updateSubcategorySchema>;
