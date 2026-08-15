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
} from "./user.schemas";
import { avatarImageUrl } from "../../middleware/upload";
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
    const user = await userRepository.updateAvatar(req.user!.sub, avatarImageUrl(req.file.filename));
    if (!user) throw new ApiError(404, "User not found");
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
