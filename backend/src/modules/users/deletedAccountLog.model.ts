import { Schema, model, Types, type InferSchemaType } from "mongoose";

// Permanent audit record of every account actually purged from the database. Written right
// before the User document (and its store/listings) are deleted for good, since after that
// point nothing else remembers the account ever existed. See accountDeletion.service.ts.
const deletedAccountLogSchema = new Schema(
  {
    // Snapshot of the account at the moment it was purged — not a ref, since the User document
    // won't exist to populate from afterwards.
    name: { type: String, required: true },
    businessName: { type: String, default: "" },
    phone: { type: String, required: true },
    email: { type: String },
    source: {
      type: String,
      enum: ["grace-period-expired", "admin-forced", "admin-direct"],
      required: true,
    },
    reason: { type: String },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

deletedAccountLogSchema.index({ deletedAt: -1 });

export type DeletedAccountLogDocument = InferSchemaType<typeof deletedAccountLogSchema> & { _id: Types.ObjectId };
export const DeletedAccountLogModel = model("DeletedAccountLog", deletedAccountLogSchema);
