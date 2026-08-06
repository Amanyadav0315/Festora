import { Schema, model } from "mongoose";

const wishlistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
  },
  { timestamps: true }
);

wishlistSchema.index({ userId: 1, listingId: 1 }, { unique: true });

export const WishlistModel = model("Wishlist", wishlistSchema);
