import { Schema, model, Types, type InferSchemaType } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["price_drop", "listing_available", "new_review", "verified_badge", "report_resolved"],
      required: true,
    },
    message: { type: String, required: true, trim: true },
    listingId: { type: Schema.Types.ObjectId, ref: "Listing" },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema> & { _id: Types.ObjectId };

export const NotificationModel = model("Notification", notificationSchema);
