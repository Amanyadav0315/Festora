import fs from "node:fs";
import path from "node:path";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { userRepository } from "./user.repository";
import { UserModel } from "./user.model";
import { toUserDTO } from "./user.mapper";
import { ApiError } from "../../middleware/errorHandler";
import {
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
  updatePhoneVisibilitySchema,
  requestEmailChangeSchema,
  confirmEmailChangeSchema,
  requestPhoneChangeSchema,
  confirmPhoneChangeSchema,
} from "./user.schemas";
import { otpService } from "../otp/otp.service";
import { avatarImageUrl } from "../../middleware/upload";

// Best-effort cleanup so replacing/removing an avatar doesn't leave orphaned files behind in
// local disk storage. Never throws — a missing/already-deleted file is not worth failing the
// request over.
function deleteLocalAvatarFile(avatarUrl: string | undefined) {
  if (!avatarUrl || !avatarUrl.startsWith("/uploads/avatars/")) return;
  const filePath = path.join(__dirname, "..", "..", "..", avatarUrl);
  fs.unlink(filePath, () => {});
}
import { FollowModel } from "../social/follow.model";
import { BlockModel } from "../social/block.model";
import { StoreModel } from "../stores/store.model";
import { ListingModel } from "../listings/listing.model";
import { ReviewModel } from "../reviews/review.model";
import { getRatingSummary } from "../reviews/review.controller";

const SALT_ROUNDS = 10;
// Must match the cookie name/path auth.controller.ts issues the refresh token under, so
// deleting the account also ends the current session immediately.
const REFRESH_COOKIE = "eventsaman_refresh_token";
const REFRESH_COOKIE_PATH = "/api/auth";

function toStoreDTO(store: any) {
  return {
    id: store._id.toString(),
    ownerId: store.ownerId.toString(),
    name: store.name,
    description: store.description,
    categories: store.categories,
    city: store.city,
    unavailableDates: store.unavailableDates ?? [],
    createdAt: store.createdAt.toISOString(),
  };
}

async function requirePasswordMatch(userId: string, password: string) {
  const user = await UserModel.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(400, "Incorrect password");
  return user;
}

// The unique indexes are the real guard against two accounts claiming the same email/phone;
// the up-front findBy* checks only give a friendlier error in the common case.
async function saveContactChange(user: InstanceType<typeof UserModel>, field: "email" | "phone", value: string) {
  user[field] = value;
  try {
    await user.save();
  } catch (err: any) {
    if (err?.code === 11000) {
      throw new ApiError(409, field === "email" ? "Email already in use" : "Phone number already in use");
    }
    throw err;
  }
}

export const userController = {
  async me(req: Request, res: Response) {
    const user = await userRepository.findById(req.user!.sub);
    if (!user) throw new ApiError(404, "User not found");
    res.json({ user: toUserDTO(user) });
  },

  async updateMe(req: Request, res: Response) {
    const input = updateProfileSchema.parse(req.body);
    const user = await userRepository.updateProfile(req.user!.sub, input);
    if (!user) throw new ApiError(404, "User not found");
    res.json({ user: toUserDTO(user) });
  },

  async updateAvatar(req: Request, res: Response) {
    if (!req.file) throw new ApiError(400, "No image uploaded");
    const previous = await userRepository.findById(req.user!.sub);
    const user = await userRepository.updateAvatar(req.user!.sub, avatarImageUrl(req.file.filename));
    if (!user) throw new ApiError(404, "User not found");
    deleteLocalAvatarFile((previous as any)?.avatarUrl);
    res.json({ user: toUserDTO(user) });
  },

  async removeAvatar(req: Request, res: Response) {
    const previous = await userRepository.findById(req.user!.sub);
    const user = await userRepository.removeAvatar(req.user!.sub);
    if (!user) throw new ApiError(404, "User not found");
    deleteLocalAvatarFile((previous as any)?.avatarUrl);
    res.json({ user: toUserDTO(user) });
  },

  async changePassword(req: Request, res: Response) {
    const input = changePasswordSchema.parse(req.body);
    const user = await UserModel.findById(req.user!.sub);
    if (!user) throw new ApiError(404, "User not found");

    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid) throw new ApiError(400, "Current password is incorrect");

    user.passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
    await user.save();
    res.json({ updated: true });
  },

  // Email change: the code goes to the NEW address, so only someone who controls it can claim it.
  async requestEmailChange(req: Request, res: Response) {
    const input = requestEmailChangeSchema.parse(req.body);
    const user = await requirePasswordMatch(req.user!.sub, input.password);
    const newEmail = input.newEmail.toLowerCase().trim();
    if (newEmail === user.email) throw new ApiError(400, "This is already your email address");
    if (await userRepository.findByEmail(newEmail)) throw new ApiError(409, "Email already in use");
    const result = await otpService.sendOtp({ email: newEmail, purpose: "email-change" });
    res.json(result);
  },

  async confirmEmailChange(req: Request, res: Response) {
    const input = confirmEmailChangeSchema.parse(req.body);
    const newEmail = input.newEmail.toLowerCase().trim();
    const user = await UserModel.findById(req.user!.sub);
    if (!user) throw new ApiError(404, "User not found");
    if (await userRepository.findByEmail(newEmail)) throw new ApiError(409, "Email already in use");
    await otpService.verifyOtp({ email: newEmail, code: input.code, purpose: "email-change" });
    await saveContactChange(user, "email", newEmail);
    res.json({ user: toUserDTO(user) });
  },

  // Phone change: there's no SMS provider, so the code goes to the account's current (verified)
  // email instead. Accounts without an email must add one first.
  async requestPhoneChange(req: Request, res: Response) {
    const input = requestPhoneChangeSchema.parse(req.body);
    const user = await requirePasswordMatch(req.user!.sub, input.password);
    if (!user.email) throw new ApiError(400, "Please add an email address to your account first to verify a phone number change");
    if (input.newPhone === user.phone) throw new ApiError(400, "This is already your phone number");
    if (await userRepository.findByPhone(input.newPhone)) throw new ApiError(409, "Phone number already in use");
    const result = await otpService.sendOtp({ email: user.email, purpose: "phone-change" });
    res.json(result);
  },

  async confirmPhoneChange(req: Request, res: Response) {
    const input = confirmPhoneChangeSchema.parse(req.body);
    const user = await UserModel.findById(req.user!.sub);
    if (!user) throw new ApiError(404, "User not found");
    if (!user.email) throw new ApiError(400, "Please add an email address to your account first to verify a phone number change");
    if (await userRepository.findByPhone(input.newPhone)) throw new ApiError(409, "Phone number already in use");
    await otpService.verifyOtp({ email: user.email, code: input.code, purpose: "phone-change" });
    await saveContactChange(user, "phone", input.newPhone);
    res.json({ user: toUserDTO(user) });
  },

  async updatePhoneVisibility(req: Request, res: Response) {
    const input = updatePhoneVisibilitySchema.parse(req.body);
    const user = await userRepository.updatePhoneVisibility(req.user!.sub, input.showPhonePublicly);
    if (!user) throw new ApiError(404, "User not found");
    res.json({ user: toUserDTO(user) });
  },

  async deleteMe(req: Request, res: Response) {
    const input = deleteAccountSchema.parse(req.body);
    const user = await UserModel.findById(req.user!.sub);
    if (!user) throw new ApiError(404, "User not found");

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new ApiError(400, "Incorrect password");

    // Soft delete only: the account and its data are kept for 60 days. Logging back in
    // during that window restores it automatically (see auth.service.ts); after 60 days
    // the background sweep purges it permanently (accountDeletion.service.ts).
    user.deletionRequestedAt = new Date();
    await user.save();

    // End the current session right away, same as logout.
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
    res.status(204).send();
  },

  async publicProfile(req: Request, res: Response) {
    const target = await userRepository.findById(req.params.id);
    if (!target || (target as any).adminDeletedAt) throw new ApiError(404, "User not found");

    const viewerId = req.user?.sub;
    const store = await StoreModel.findOne({ ownerId: target._id });

    const [followersCount, followingCount, postsCount, isFollowing, isBlocked, ratingSummary, myReview] =
      await Promise.all([
        FollowModel.countDocuments({ followingId: target._id }),
        FollowModel.countDocuments({ followerId: target._id }),
        store ? ListingModel.countDocuments({ storeId: store._id, isActive: true }) : Promise.resolve(0),
        viewerId ? FollowModel.exists({ followerId: viewerId, followingId: target._id }) : Promise.resolve(false),
        viewerId ? BlockModel.exists({ blockerId: viewerId, blockedId: target._id }) : Promise.resolve(false),
        getRatingSummary(target._id.toString()),
        viewerId ? ReviewModel.findOne({ reviewerId: viewerId, revieweeId: target._id }) : Promise.resolve(null),
      ]);

    res.json({
      profile: {
        id: target._id.toString(),
        name: target.name,
        businessName: (target as any).businessName || target.name,
        about: (target as any).about || undefined,
        avatarUrl: (target as any).avatarUrl || undefined,
        // Only ever included when the account owner has explicitly opted in — never leak a
        // phone number to other users by default.
        phone: (target as any).showPhonePublicly ? target.phone : undefined,
        createdAt: (target as any).createdAt.toISOString(),
        followersCount,
        followingCount,
        postsCount,
        isFollowing: !!isFollowing,
        isBlocked: !!isBlocked,
        isSelf: viewerId === target._id.toString(),
        isVerified: Boolean((target as any).isVerified),
        ratingAvg: ratingSummary.ratingAvg,
        ratingCount: ratingSummary.ratingCount,
        myRating: myReview ? myReview.rating : undefined,
        store: store ? toStoreDTO(store) : undefined,
      },
    });
  },
};
