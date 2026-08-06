import { z } from "zod";

export const reportUserSchema = z.object({
  reason: z.string().min(3).max(500),
  conversationId: z.string().optional(),
});

export type ReportUserInput = z.infer<typeof reportUserSchema>;
