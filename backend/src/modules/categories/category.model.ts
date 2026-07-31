import { Schema, model } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    icon: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

export const CategoryModel = model("Category", categorySchema);
