import { Schema, model } from "mongoose";
import { CATEGORY_SLUGS } from "@festora/types";

const storeSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    categories: [{ type: String, enum: CATEGORY_SLUGS }],
    city: { type: String },
  },
  { timestamps: true }
);

export const StoreModel = model("Store", storeSchema);
