import { Schema, model } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true },
    nameHi: { type: String },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    descriptionHi: { type: String },
    icon: { type: String },
    imageUrl: { type: String },
    isMain: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const CategoryModel = model("Category", categorySchema);
