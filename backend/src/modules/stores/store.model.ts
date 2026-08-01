import { Schema, model } from "mongoose";

const storeSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    categories: [{ type: String }],
    city: { type: String },
  },
  { timestamps: true }
);

export const StoreModel = model("Store", storeSchema);
