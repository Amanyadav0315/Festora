import { z } from "zod";
import { CATEGORY_SLUGS } from "@festora/types";

export const createListingSchema = z.object({
  categorySlug: z.enum(CATEGORY_SLUGS),
  subcategorySlug: z.string().optional(),
  type: z.enum(["product", "rental", "venue", "service"]),
  title: z.string().min(3).max(150),
  description: z.string().max(3000).optional(),
  price: z.number().min(0),
  priceUnit: z.string().max(50).optional(),
  images: z.array(z.string()).default([]),
  city: z.string().max(100).optional(),
});

export const listListingsQuerySchema = z.object({
  categorySlug: z.enum(CATEGORY_SLUGS).optional(),
  subcategorySlug: z.string().optional(),
  type: z.enum(["product", "rental", "venue", "service"]).optional(),
  city: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type ListListingsQuery = z.infer<typeof listListingsQuerySchema>;
