import { Schema, model } from "mongoose";
import { CATEGORY_SLUGS } from "@festora/types";

const listingSchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    categorySlug: { type: String, enum: CATEGORY_SLUGS, required: true },
    subcategorySlug: { type: String },
    type: { type: String, enum: ["product", "rental", "venue", "service"], required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    priceUnit: { type: String },
    images: [{ type: String }],
    city: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

listingSchema.index({ title: "text", description: "text" });

export const ListingModel = model("Listing", listingSchema);
