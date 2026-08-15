import { z } from "zod";

const jsonArray = z
  .union([z.array(z.string()), z.string()])
  .transform((v) => (Array.isArray(v) ? v : JSON.parse(v)));

export const createListingSchema = z.object({
  categorySlugs: jsonArray.pipe(z.array(z.string().min(1)).min(1).max(3)),
  subcategorySlug: z.string().optional(),
  condition: z.enum(["new", "old"]),
  purpose: z.enum(["sell", "rent"]),
  title: z.string().min(3).max(150),
  keywords: jsonArray.pipe(z.array(z.string().min(1).max(40)).min(1).max(10)),
  description: z.string().min(1).max(200),
  descriptionHi: z.string().max(200).optional(),
  price: z.coerce.number().min(0),
  priceUnit: z.string().max(50).optional(),
  images: z.array(z.string()).default([]),
  city: z.string().max(100).optional(),
  locationUrl: z.string().trim().url().max(500).optional().or(z.literal("").transform(() => undefined)),
});

export const updateListingSchema = z.object({
  categorySlugs: jsonArray.pipe(z.array(z.string().min(1)).min(1).max(3)).optional(),
  subcategorySlug: z.string().optional(),
  condition: z.enum(["new", "old"]).optional(),
  purpose: z.enum(["sell", "rent"]).optional(),
  title: z.string().min(3).max(150).optional(),
  keywords: jsonArray.pipe(z.array(z.string().min(1).max(40)).min(1).max(10)).optional(),
  description: z.string().min(1).max(200).optional(),
  descriptionHi: z.string().max(200).optional(),
  price: z.coerce.number().min(0).optional(),
  priceUnit: z.string().max(50).optional(),
  existingImages: jsonArray.pipe(z.array(z.string())).optional(),
  city: z.string().max(100).optional(),
  locationUrl: z.string().trim().url().max(500).optional().or(z.literal("").transform(() => undefined)),
  isActive: z
    .union([z.boolean(), z.string()])
    .transform((v) => v === true || v === "true")
    .optional(),
});

export const listListingsQuerySchema = z.object({
  categorySlug: z.string().optional(),
  subcategorySlug: z.string().optional(),
  condition: z.enum(["new", "old"]).optional(),
  purpose: z.enum(["sell", "rent"]).optional(),
  // Comma-separated list of cities: the searched city plus its "nearby" (same-state) cities.
  city: z.string().optional(),
  cities: z.string().optional(),
  q: z.string().optional(),
  storeId: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["newest", "priceLow", "priceHigh"]).default("newest"),
  includeInactive: z
    .union([z.boolean(), z.string()])
    .transform((v) => v === true || v === "true")
    .optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListListingsQuery = z.infer<typeof listListingsQuerySchema>;
