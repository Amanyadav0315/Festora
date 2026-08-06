import { z } from "zod";

export const issueReportSchema = z.object({
  message: z.string().min(3, "Please describe the issue (min 3 characters)").max(1000),
});

export type IssueReportInput = z.infer<typeof issueReportSchema>;
