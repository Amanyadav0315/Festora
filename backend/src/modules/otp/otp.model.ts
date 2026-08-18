import { Schema, model, Types, type InferSchemaType } from "mongoose";

const otpSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    code: { type: String, required: true },
    purpose: { type: String, enum: ["signup", "reset", "email-change"], required: true },
    expiresAt: { type: Date, required: true },
    isUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Used both to fetch "the latest matching, unused OTP" during verification and to count how
// many OTPs an email has requested recently (resend-limit check in otp.service.ts).
otpSchema.index({ email: 1, purpose: 1, createdAt: -1 });

export type OtpDocument = InferSchemaType<typeof otpSchema> & { _id: Types.ObjectId };

export const OtpModel = model("Otp", otpSchema);
