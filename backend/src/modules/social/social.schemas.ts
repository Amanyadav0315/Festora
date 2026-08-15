import { z } from "zod";

export const reportCategorySchema = z.enum(["behavior", "transaction_dispute", "scam_suspicion", "other"]);

export const reportUserSchema = z.object({
  reason: z.string().min(3).max(500),
  category: reportCategorySchema.default("other"),
  conversationId: z.string().optional(),
});

export type ReportUserInput = z.infer<typeof reportUserSchema>;

export const resolveReportSchema = z.object({
  notes: z.string().trim().min(3, "Please add a short note (min 3 characters)").max(1000),
});
