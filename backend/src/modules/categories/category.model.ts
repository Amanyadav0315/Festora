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
  },
  { timestamps: true }
);

export const CategoryModel = model("Category", categorySchema);
