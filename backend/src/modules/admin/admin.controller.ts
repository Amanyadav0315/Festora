import type { Request, Response } from "express";
import { UserModel } from "../users/user.model";
import { StoreModel } from "../stores/store.model";
import { ListingModel } from "../listings/listing.model";
import { toListingDTO } from "../listings/listing.mapper";
import { purgeUserData } from "../users/accountDeletion.service";
import { ApiError } from "../../middleware/errorHandler";
import {
  listUsersQuerySchema,
  userListingsQuerySchema,
  deleteUserSchema,
  deletePostSchema,
  deletedListQuerySchema,
} from "./admin.schemas";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rangeSince(range: string): Date | undefined {
  const now = Date.now();
  switch (range) {
    case "24h":
      return new Date(now - 24 * 60 * 60 * 1000);
    case "week":
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    case "year":
      return new Date(now - 365 * 24 * 60 * 60 * 1000);
    default:
      return undefined;
  }
}

async function citiesByOwner(ownerIds: string[]): Promise<Map<string, string | undefined>> {
  const stores = await StoreModel.find({ ownerId: { $in: ownerIds } }, { ownerId: 1, city: 1 });
  const map = new Map<string, string | undefined>();
  for (const s of stores) map.set(s.ownerId.toString(), s.city ?? undefined);
  return map;
}

async function postsCountByOwner(ownerIds: string[]): Promise<Map<string, number>> {
  const stores = await StoreModel.find({ ownerId: { $in: ownerIds } }, { ownerId: 1 });
  const storeIdToOwner = new Map(stores.map((s) => [s._id.toString(), s.ownerId.toString()]));
  const storeIds = stores.map((s) => s._id);
  const counts = await ListingModel.aggregate([
    { $match: { storeId: { $in: storeIds }, adminDeletedAt: null } },
    { $group: { _id: "$storeId", count: { $sum: 1 } } },
  ]);
  const map = new Map<string, number>();
  for (const c of counts) {
    const ownerId = storeIdToOwner.get(c._id.toString());
    if (ownerId) map.set(ownerId, c.count);
  }
  return map;
}

function toAdminUserListItem(u: any, city: string | undefined, postsCount: number) {
  return {
    id: u._id.toString(),
    name: u.name,
    businessName: u.businessName || u.name,
    phone: u.phone,
    email: u.email || undefined,
    city,
    role: u.role,
    postsCount,
    createdAt: u.createdAt.toISOString(),
  };
}

export const adminController = {
  // GET /admin/users?search=&page=&limit=
  async listUsers(req: Request, res: Response) {
    const query = listUsersQuerySchema.parse(req.query);
    const filter: Record<string, unknown> = { adminDeletedAt: null };
    if (query.search) {
      const re = new RegExp(escapeRegex(query.search), "i");
      filter.$or = [{ name: re }, { businessName: re }, { phone: re }, { email: re }];
    }

    const total = await UserModel.countDocuments(filter);
    const users = await UserModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit);

    const ownerIds = users.map((u) => u._id.toString());
    const [cities, postsCounts] = await Promise.all([citiesByOwner(ownerIds), postsCountByOwner(ownerIds)]);

    res.json({
      users: users.map((u) =>
        toAdminUserListItem(u, cities.get(u._id.toString()), postsCounts.get(u._id.toString()) ?? 0)
      ),
      total,
      page: query.page,
      limit: query.limit,
    });
  },

  // GET /admin/users/:id
  async getUserDetail(req: Request, res: Response) {
    const user = await UserModel.findById(req.params.id);
    if (!user || (user as any).adminDeletedAt) throw new ApiError(404, "User not found");

    const store = await StoreModel.findOne({ ownerId: user._id });
    const postsCount = store ? await ListingModel.countDocuments({ storeId: store._id, adminDeletedAt: null }) : 0;

    res.json({
      user: {
        ...toAdminUserListItem(user, store?.city ?? undefined, postsCount),
        about: (user as any).about || undefined,
        avatarUrl: (user as any).avatarUrl || undefined,
        showPhonePublicly: Boolean((user as any).showPhonePublicly),
      },
    });
  },

  // GET /admin/users/:id/listings?range=24h|week|month|year|all
  async getUserListings(req: Request, res: Response) {
    const user = await UserModel.findById(req.params.id);
    if (!user || (user as any).adminDeletedAt) throw new ApiError(404, "User not found");
    const query = userListingsQuerySchema.parse(req.query);

    const store = await StoreModel.findOne({ ownerId: user._id });
    if (!store) return res.json({ listings: [] });

    const filter: Record<string, unknown> = { storeId: store._id, adminDeletedAt: null };
    const since = rangeSince(query.range);
    if (since) filter.createdAt = { $gte: since };

    const listings = await ListingModel.find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: "storeId", populate: { path: "ownerId", select: "avatarUrl" } });

    res.json({ listings: listings.map(toListingDTO) });
  },

  // DELETE /admin/users/:id — soft delete: hides the account and cascades to their listings,
  // keeping all data intact for review/restore from Deleted Items.
  async deleteUser(req: Request, res: Response) {
    const input = deleteUserSchema.parse(req.body);
    const target = await UserModel.findById(req.params.id);
    if (!target || (target as any).adminDeletedAt) throw new ApiError(404, "User not found");
    if (target._id.toString() === req.user!.sub) throw new ApiError(400, "You cannot delete your own account here");
    if (target.role === "admin") throw new ApiError(400, "Cannot delete another admin account");

    (target as any).adminDeletedAt = new Date();
    (target as any).adminDeletedReason = input.reason;
    (target as any).adminDeletedBy = req.user!.sub;
    await target.save();

    const store = await StoreModel.findOne({ ownerId: target._id });
    if (store) {
      await ListingModel.updateMany(
        { storeId: store._id, adminDeletedAt: null },
        {
          $set: {
            adminDeletedAt: new Date(),
            adminDeletedReason: "Owner account deleted",
            adminDeletedBy: req.user!.sub,
            adminDeleteCascade: true,
          },
        }
      );
    }

    res.status(204).send();
  },

  // PATCH /admin/users/:id/restore — restores the account plus any listings that were only
  // hidden as a side effect of this deletion (not ones an admin deleted independently).
  async restoreUser(req: Request, res: Response) {
    const target = await UserModel.findById(req.params.id);
    if (!target || !(target as any).adminDeletedAt) throw new ApiError(404, "Deleted user not found");

    (target as any).adminDeletedAt = null;
    (target as any).adminDeletedReason = undefined;
    (target as any).adminDeletedBy = undefined;
    await target.save();

    const store = await StoreModel.findOne({ ownerId: target._id });
    if (store) {
      await ListingModel.updateMany(
        { storeId: store._id, adminDeleteCascade: true },
        {
          $set: {
            adminDeletedAt: null,
            adminDeletedReason: undefined,
            adminDeletedBy: undefined,
            adminDeleteCascade: false,
          },
        }
      );
    }

    res.json({ restored: true });
  },

  // DELETE /admin/users/:id/permanent — irreversible: purges the user, their store, and
  // their listings for good (same routine used for expired self-deleted accounts).
  async permanentlyDeleteUser(req: Request, res: Response) {
    const target = await UserModel.findById(req.params.id);
    if (!target || !(target as any).adminDeletedAt) throw new ApiError(404, "Deleted user not found");
    await purgeUserData(target._id.toString());
    res.status(204).send();
  },

  // GET /admin/deleted-users?search=&from=&to=&page=
  async listDeletedUsers(req: Request, res: Response) {
    const query = deletedListQuerySchema.parse(req.query);
    const dateFilter: Record<string, Date> = {};
    if (query.from) dateFilter.$gte = new Date(query.from);
    if (query.to) dateFilter.$lte = new Date(query.to);
    const filter: Record<string, unknown> = {
      adminDeletedAt: Object.keys(dateFilter).length > 0 ? { $ne: null, ...dateFilter } : { $ne: null },
    };
    if (query.search) {
      const re = new RegExp(escapeRegex(query.search), "i");
      filter.$or = [{ name: re }, { businessName: re }, { phone: re }, { email: re }];
    }

    const total = await UserModel.countDocuments(filter);
    const users = await UserModel.find(filter)
      .sort({ adminDeletedAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .populate("adminDeletedBy", "name");

    res.json({
      users: users.map((u) => ({
        ...toAdminUserListItem(u, undefined, 0),
        deletedAt: (u as any).adminDeletedAt.toISOString(),
        deletedReason: (u as any).adminDeletedReason || "",
        deletedByName: (u as any).adminDeletedBy?.name,
      })),
      total,
      page: query.page,
      limit: query.limit,
    });
  },

  // DELETE /admin/posts/:id — soft delete a single listing.
  async deletePost(req: Request, res: Response) {
    const input = deletePostSchema.parse(req.body);
    const listing = await ListingModel.findById(req.params.id);
    if (!listing || (listing as any).adminDeletedAt) throw new ApiError(404, "Listing not found");

    (listing as any).adminDeletedAt = new Date();
    (listing as any).adminDeletedReason = input.reason;
    (listing as any).adminDeletedBy = req.user!.sub;
    (listing as any).adminDeleteCascade = false;
    await listing.save();
    res.status(204).send();
  },

  // PATCH /admin/posts/:id/restore
  async restorePost(req: Request, res: Response) {
    const listing = await ListingModel.findById(req.params.id);
    if (!listing || !(listing as any).adminDeletedAt) throw new ApiError(404, "Deleted post not found");

    (listing as any).adminDeletedAt = null;
    (listing as any).adminDeletedReason = undefined;
    (listing as any).adminDeletedBy = undefined;
    (listing as any).adminDeleteCascade = false;
    await listing.save();
    res.json({ restored: true });
  },

  // DELETE /admin/posts/:id/permanent — irreversible.
  async permanentlyDeletePost(req: Request, res: Response) {
    const listing = await ListingModel.findById(req.params.id);
    if (!listing || !(listing as any).adminDeletedAt) throw new ApiError(404, "Deleted post not found");
    await listing.deleteOne();
    res.status(204).send();
  },

  // GET /admin/deleted-posts?search=&from=&to=&page= — search matches the owning user's
  // email or phone, since that's how the admin will typically be looking a post up.
  async listDeletedPosts(req: Request, res: Response) {
    const query = deletedListQuerySchema.parse(req.query);
    const dateFilter: Record<string, Date> = {};
    if (query.from) dateFilter.$gte = new Date(query.from);
    if (query.to) dateFilter.$lte = new Date(query.to);
    const filter: Record<string, unknown> = {
      adminDeletedAt: Object.keys(dateFilter).length > 0 ? { $ne: null, ...dateFilter } : { $ne: null },
    };

    if (query.search) {
      const re = new RegExp(escapeRegex(query.search), "i");
      const matchingUsers = await UserModel.find({ $or: [{ phone: re }, { email: re }] }, { _id: 1 });
      const matchingStores = await StoreModel.find({ ownerId: { $in: matchingUsers.map((u) => u._id) } }, { _id: 1 });
      filter.storeId = { $in: matchingStores.map((s) => s._id) };
    }

    const total = await ListingModel.countDocuments(filter);
    const listings = await ListingModel.find(filter)
      .sort({ adminDeletedAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .populate({ path: "storeId", populate: { path: "ownerId", select: "name businessName phone email avatarUrl" } })
      .populate("adminDeletedBy", "name");

    res.json({
      posts: listings.map((l) => {
        const dto = toListingDTO(l);
        const owner = (l.storeId as any)?.ownerId;
        return {
          ...dto,
          deletedAt: (l as any).adminDeletedAt.toISOString(),
          deletedReason: (l as any).adminDeletedReason || "",
          deletedByName: (l as any).adminDeletedBy?.name,
          ownerName: owner?.name,
          ownerBusinessName: owner?.businessName,
          ownerPhone: owner?.phone,
          ownerEmail: owner?.email,
        };
      }),
      total,
      page: query.page,
      limit: query.limit,
    });
  },
};
