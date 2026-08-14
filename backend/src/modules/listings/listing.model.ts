import { Schema, model } from "mongoose";

const listingSchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    categorySlugs: { type: [String], required: true, validate: (v: string[]) => v.length >= 1 && v.length <= 3 },
    subcategorySlug: { type: String },
    condition: { type: String, enum: ["new", "old"], required: true },
    purpose: { type: String, enum: ["sell", "rent"], required: true },
    title: { type: String, required: true, trim: true },
    keywords: { type: [String], required: true, validate: (v: string[]) => v.length >= 1 && v.length <= 10 },
    description: { type: String, required: true, maxlength: 200 },
    descriptionHi: { type: String, maxlength: 200 },
    price: { type: Number, required: true, min: 0 },
    priceUnit: { type: String },
    images: {
      type: [String],
      required: true,
      validate: (v: string[]) => v.length >= 1 && v.length <= 6,
    },
    city: { type: String },
    locationUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

listingSchema.index({ title: "text", description: "text", descriptionHi: "text", keywords: "text" });

export const ListingModel = model("Listing", listingSchema);
