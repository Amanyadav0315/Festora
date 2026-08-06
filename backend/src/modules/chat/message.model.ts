import { Schema, model } from "mongoose";

const messageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, maxlength: 2000 },
    imageUrl: { type: String },
    replyToId: { type: Schema.Types.ObjectId, ref: "Message" },
    editedAt: { type: Date },
    // Per-user "delete for me" — hides the message only for those users, everyone else still
    // sees it. Distinct from a real "delete for everyone" which blanks the content for all.
    deletedFor: { type: [Schema.Types.ObjectId], default: [] },
    deletedForEveryone: { type: Boolean, default: false },
    readBy: { type: [Schema.Types.ObjectId], default: [] },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export const MessageModel = model("Message", messageSchema);
