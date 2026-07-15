import { Schema, model } from "mongoose";
import { CATEGORY_SLUGS } from "@festora/types";

const subcategorySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    categorySlug: { type: String, enum: CATEGORY_SLUGS, required: true },
    description: { type: String },
    icon: { type: String },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const SubcategoryModel = model("Subcategory", subcategorySchema);
