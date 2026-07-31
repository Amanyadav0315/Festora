import type { Request, Response } from "express";
import { userRepository } from "./user.repository";
import { toUserDTO } from "./user.mapper";
import { ApiError } from "../../middleware/errorHandler";
import { updateProfileSchema } from "./user.schemas";
import { FollowModel } from "../social/follow.model";
import { BlockModel } from "../social/block.model";
import { StoreModel } from "../stores/store.model";
import { ListingModel } from "../listings/listing.model";

function toStoreDTO(store: any) {
  return {
    id: store._id.toString(),
    ownerId: store.ownerId.toString(),
    name: store.name,
    description: store.description,
    categories: store.categories,
    city: store.city,
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

  async publicProfile(req: Request, res: Response) {
    const target = await userRepository.findById(req.params.id);
    if (!target) throw new ApiError(404, "User not found");

    const viewerId = req.user?.sub;
    const store = await StoreModel.findOne({ ownerId: target._id });

    const [followersCount, followingCount, postsCount, isFollowing, isBlocked] = await Promise.all([
      FollowModel.countDocuments({ followingId: target._id }),
      FollowModel.countDocuments({ followerId: target._id }),
      store ? ListingModel.countDocuments({ storeId: store._id, isActive: true }) : Promise.resolve(0),
      viewerId ? FollowModel.exists({ followerId: viewerId, followingId: target._id }) : Promise.resolve(false),
      viewerId ? BlockModel.exists({ blockerId: viewerId, blockedId: target._id }) : Promise.resolve(false),
    ]);

    res.json({
      profile: {
        id: target._id.toString(),
        name: target.name,
        createdAt: (target as any).createdAt.toISOString(),
        followersCount,
        followingCount,
        postsCount,
        isFollowing: !!isFollowing,
        isBlocked: !!isBlocked,
        isSelf: viewerId === target._id.toString(),
        store: store ? toStoreDTO(store) : undefined,
      },
    });
  },
};
