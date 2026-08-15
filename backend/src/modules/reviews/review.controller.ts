import type { Request, Response } from "express";
import { Types } from "mongoose";
import type { ReviewDTO } from "@eventsaman/types";
import { ReviewModel } from "./review.model";
import { UserModel } from "../users/user.model";
import { writeReviewSchema } from "./review.schemas";
import { ApiError } from "../../middleware/errorHandler";
import { notifyUser } from "../notifications/notification.service";

function toReviewDTO(r: any): ReviewDTO {
  return {
    id: r._id.toString(),
    reviewerId: r.reviewerId._id ? r.reviewerId._id.toString() : r.reviewerId.toString(),
    reviewerName: r.reviewerId?.name ?? "Deleted user",
    reviewerAvatarUrl: r.reviewerId?.avatarUrl || undefined,
    revieweeId: r.revieweeId.toString(),
    rating: r.rating,
    comment: r.comment || undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

// Shared by user.controller.ts publicProfile() to surface rating summary without a second round trip.
export async function getRatingSummary(userId: string) {
  const [agg] = await ReviewModel.aggregate([
    { $match: { revieweeId: new Types.ObjectId(userId) } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  return { ratingAvg: agg ? Math.round(agg.avg * 10) / 10 : 0, ratingCount: agg ? agg.count : 0 };
}

export const reviewController = {
  // GET /reviews/:userId — public list of reviews received by a user, newest first.
  async list(req: Request, res: Response) {
    const reviews = await ReviewModel.find({ revieweeId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("reviewerId", "name avatarUrl");
    res.json({ reviews: reviews.map(toReviewDTO) });
  },

  // PUT /reviews/:userId — create or edit the caller's own review of that user (upsert).
  async write(req: Request, res: Response) {
    const revieweeId = req.params.userId;
    if (revieweeId === req.user!.sub) throw new ApiError(400, "You cannot review yourself");
    const target = await UserModel.findById(revieweeId);
    if (!target || (target as any).adminDeletedAt) throw new ApiError(404, "User not found");

    const input = writeReviewSchema.parse(req.body);
    const review = await ReviewModel.findOneAndUpdate(
      { reviewerId: req.user!.sub, revieweeId },
      { $set: { rating: input.rating, comment: input.comment } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate("reviewerId", "name avatarUrl");
    notifyUser(revieweeId, "new_review", `${(review.reviewerId as any)?.name ?? "Someone"} rated you ${input.rating}★`).catch(() => {});
    res.status(201).json({ review: toReviewDTO(review) });
  },

  // DELETE /reviews/:userId — remove the caller's own review of that user.
  async remove(req: Request, res: Response) {
    await ReviewModel.deleteOne({ reviewerId: req.user!.sub, revieweeId: req.params.userId });
    res.status(204).send();
  },
};
