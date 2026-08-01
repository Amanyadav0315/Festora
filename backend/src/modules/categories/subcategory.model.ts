import { Schema, model } from "mongoose";

const subcategorySchema = new Schema(
  {
    name: { type: String, required: true },
    nameHi: { type: String },
    slug: { type: String, required: true, unique: true },
    categorySlug: { type: String, required: true },
    description: { type: String },
    icon: { type: String },
    imageUrl: { type: String },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const SubcategoryModel = model("Subcategory", subcategorySchema);
