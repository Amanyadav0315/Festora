import { Schema, model } from "mongoose";

const reportSchema = new Schema(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reportedId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    screenshots: { type: [String], default: [] },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    status: { type: String, enum: ["pending", "reviewed"], default: "pending", required: true },
  },
  { timestamps: true }
);

export const ReportModel = model("Report", reportSchema);
