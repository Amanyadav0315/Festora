import { Schema, model } from "mongoose";

const issueReportSchema = new Schema(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    screenshots: { type: [String], default: [] },
    status: { type: String, enum: ["pending", "reviewed"], default: "pending", required: true },
  },
  { timestamps: true }
);

export const IssueReportModel = model("IssueReport", issueReportSchema);
