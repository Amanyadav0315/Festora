import { Schema, model } from "mongoose";

const reportSchema = new Schema(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reportedId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    // What kind of issue this is — lets admins tell a behavior complaint apart from a dispute
    // over a specific deal. "transaction_dispute" is explicitly about buyer/seller disagreements
    // (non-delivery, quality, refund) that the platform can only mediate communication on — it
    // is not a party to the underlying transaction and does not adjudicate money owed.
    category: {
      type: String,
      enum: ["behavior", "transaction_dispute", "scam_suspicion", "other"],
      default: "other",
      required: true,
    },
    screenshots: { type: [String], default: [] },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    status: { type: String, enum: ["pending", "reviewed", "resolved"], default: "pending", required: true },
    // Filled in when an admin closes out the report — a short note on how it was handled
    // (e.g. "Warned seller", "No policy violation found", "Advised both parties to communicate
    // directly — platform does not process refunds"). Visible to the reporter as a notification.
    resolutionNotes: { type: String, trim: true, maxlength: 1000 },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const ReportModel = model("Report", reportSchema);
