import { Schema, model, Types, type InferSchemaType } from "mongoose";

const reviewSchema = new Schema(
  {
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    revieweeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true }
);

// One review per (reviewer, reviewee) pair — writing again edits the existing review instead
// of creating a duplicate (enforced via upsert in review.controller.ts, backed by this index).
reviewSchema.index({ reviewerId: 1, revieweeId: 1 }, { unique: true });
reviewSchema.index({ revieweeId: 1, createdAt: -1 });

export type ReviewDocument = InferSchemaType<typeof reviewSchema> & { _id: Types.ObjectId };

export const ReviewModel = model("Review", reviewSchema);
