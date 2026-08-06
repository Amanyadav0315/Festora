import { Schema, model } from "mongoose";

const conversationSchema = new Schema(
  {
    participants: {
      type: [Schema.Types.ObjectId],
      required: true,
      validate: (v: unknown[]) => v.length === 2,
    },
    // "<lowerId>_<higherId>" — a sorted-pair fingerprint so a unique index can enforce "one
    // conversation per pair of users" (a unique index directly on the participants array
    // would be multikey and enforce per-element, not per-pair, uniqueness).
    pairKey: { type: String, required: true, unique: true },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessageText: { type: String },
  },
  { timestamps: true }
);

export function pairKeyFor(userIdA: string, userIdB: string): string {
  return [userIdA, userIdB].sort().join("_");
}

export const ConversationModel = model("Conversation", conversationSchema);
