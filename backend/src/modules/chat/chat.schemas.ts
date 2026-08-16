import { z } from "zod";

export const sendMessageSchema = z
  .object({
    text: z.string().trim().max(2000).optional(),
    replyToId: z.string().optional(),
    // Present only on the message that kicks off a "message seller about this listing" chat.
    listingId: z.string().optional(),
  })
  .refine((v) => (v.text && v.text.length > 0) || true, { message: "Message cannot be empty" });

export const editMessageSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

export const listMessagesQuerySchema = z.object({
  before: z.string().optional(), // message id cursor — messages older than this
  limit: z.coerce.number().min(1).max(100).default(30),
});
