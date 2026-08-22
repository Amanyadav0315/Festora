import { UserModel } from "./user.model";
import { StoreModel } from "../stores/store.model";
import { ListingModel } from "../listings/listing.model";
import { FollowModel } from "../social/follow.model";
import { BlockModel } from "../social/block.model";
import { DeletedAccountLogModel } from "./deletedAccountLog.model";

// How long a soft-deleted account's data is kept before it is purged for good.
export const DELETION_GRACE_PERIOD_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

// How often the background sweep checks for expired soft-deleted accounts. This project
// intentionally has no job queue/cron infra (see CLAUDE.md), so a periodic in-process
// setInterval is the simplest correct option — it runs synchronously within the same
// long-lived Node process that PM2 keeps alive in production.
const SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

export function isDeletionExpired(deletionRequestedAt: Date): boolean {
  return Date.now() - deletionRequestedAt.getTime() >= DELETION_GRACE_PERIOD_MS;
}

export type PurgeSource = "grace-period-expired" | "admin-forced" | "admin-direct";

export type PurgeMeta = {
  source: PurgeSource;
  reason?: string;
  deletedBy?: string;
};

/**
 * Permanently removes a user and everything owned by them: their store(s), the listings
 * under those stores, and their follow/block relationships. Safe to call more than once
 * for the same id (all queries are no-ops once the user is gone).
 *
 * Before deleting, writes a permanent snapshot to DeletedAccountLogModel — this is the only
 * record left once the User document itself is gone, and is what the admin panel's
 * "Deletion Log" screen reads from.
 */
export async function purgeUserData(userId: string, meta: PurgeMeta): Promise<void> {
  const user = await UserModel.findById(userId, { name: 1, businessName: 1, phone: 1, email: 1 });
  if (user) {
    await DeletedAccountLogModel.create({
      name: user.name,
      businessName: user.businessName || "",
      phone: user.phone,
      email: user.email || undefined,
      source: meta.source,
      reason: meta.reason,
      deletedBy: meta.deletedBy,
      deletedAt: new Date(),
    });
  }

  const stores = await StoreModel.find({ ownerId: userId }, { _id: 1 });
  const storeIds = stores.map((s) => s._id);

  if (storeIds.length > 0) {
    await ListingModel.deleteMany({ storeId: { $in: storeIds } });
    await StoreModel.deleteMany({ _id: { $in: storeIds } });
  }

  await FollowModel.deleteMany({ $or: [{ followerId: userId }, { followingId: userId }] });
  await BlockModel.deleteMany({ $or: [{ blockerId: userId }, { blockedId: userId }] });
  await UserModel.deleteOne({ _id: userId });
}

/**
 * Finds every soft-deleted account whose 60-day grace period has elapsed and purges them
 * for good. Errors on one account never stop the sweep from processing the rest.
 */
export async function purgeExpiredAccounts(): Promise<void> {
  const cutoff = new Date(Date.now() - DELETION_GRACE_PERIOD_MS);
  const expired = await UserModel.find(
    { deletionRequestedAt: { $ne: null, $lte: cutoff } },
    { _id: 1 }
  );

  for (const user of expired) {
    try {
      await purgeUserData(user._id.toString(), { source: "grace-period-expired" });
    } catch (err) {
      console.error(`[accountDeletion] failed to purge user ${user._id.toString()}`, err);
    }
  }
}

/** Starts the recurring background sweep. Call once at server boot, after the DB connects. */
export function startAccountDeletionSweep(): void {
  purgeExpiredAccounts().catch((err) => console.error("[accountDeletion] initial sweep failed", err));
  setInterval(() => {
    purgeExpiredAccounts().catch((err) => console.error("[accountDeletion] sweep failed", err));
  }, SWEEP_INTERVAL_MS).unref();
}
