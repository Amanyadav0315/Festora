import { Schema, model } from "mongoose";

const storeSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    categories: [{ type: String }],
    city: { type: String },
    // Dates (YYYY-MM-DD, no time component) the seller has marked themselves unavailable —
    // purely informational for buyers deciding who to contact. This is NOT a booking/payment
    // system: Event Saman does not confirm, hold, or guarantee any date: the buyer and seller
    // still coordinate and finalize everything directly between themselves.
    unavailableDates: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const StoreModel = model("Store", storeSchema);
