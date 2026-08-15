import { z } from "zod";

export const dateRangeFilterSchema = z.enum(["24h", "week", "month", "year", "all"]);

export const listUsersQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const userListingsQuerySchema = z.object({
  range: dateRangeFilterSchema.default("all"),
});

export const deleteUserSchema = z.object({
  reason: z.string().trim().min(3, "Please provide a reason (min 3 characters)").max(300),
});

export const deletePostSchema = z.object({
  reason: z.string().trim().min(3, "Please provide a reason (min 3 characters)").max(300),
});

// Bulk moderation — admin selects several rows in the admin UI and applies one action to all
// of them. Capped at 100 per request so a single request can't be used to mass-mutate the DB.
export const bulkIdsSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
});

export const bulkDeleteSchema = bulkIdsSchema.extend({
  reason: z.string().trim().min(3, "Please provide a reason (min 3 characters)").max(300),
});

export const bulkVerifySchema = bulkIdsSchema.extend({
  isVerified: z.boolean(),
});

export const deletedListQuerySchema = z.object({
  search: z.string().trim().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type DeletedListQuery = z.infer<typeof deletedListQuerySchema>;
