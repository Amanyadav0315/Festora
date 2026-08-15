import { Schema, model, Types, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    // Shown on the user's store/listings instead of their personal name. Required for every
    // *new* signup (enforced by signup.schemas.ts), but left non-required at the schema level
    // so existing production accounts created before this field existed don't fail validation
    // on their next unrelated save() (e.g. change password).
    businessName: { type: String, trim: true, maxlength: 100, default: "" },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: false, unique: true, sparse: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user", required: true },
    about: { type: String, trim: true, maxlength: 200, default: "" },
    avatarUrl: { type: String },
    // Opt-in: when true, this user's phone number is included in their public profile response.
    showPhonePublicly: { type: Boolean, default: false },
    // Admin-granted trust badge — shown on public profile/listings. Not self-service; only an
    // admin can toggle it (see admin.controller.ts verifyUser).
    isVerified: { type: Boolean, default: false },
    // Compliance record: when the user accepted the Privacy Policy + Terms & Conditions at signup.
    termsAcceptedAt: { type: Date },
    // Soft-delete marker: set when the user requests account deletion. Logging back in before
    // the 60-day grace period elapses clears this (auto-restores the account); the background
    // sweep in accountDeletion.service.ts permanently purges accounts whose grace period expired.
    deletionRequestedAt: { type: Date, default: null },
    // Admin-driven soft delete — distinct from the self-service deletion above. An admin-deleted
    // account cannot log back in to auto-restore itself; only an admin can restore it (or purge
    // it for good) from the admin panel's Deleted Items > Users screen.
    adminDeletedAt: { type: Date, default: null },
    adminDeletedReason: { type: String },
    adminDeletedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };

export const UserModel = model("User", userSchema);
