import { NotificationModel } from "./notification.model";
import { WishlistModel } from "../wishlist/wishlist.model";

export type NotificationType =
  | "price_drop"
  | "listing_available"
  | "new_review"
  | "verified_badge"
  | "report_resolved"
  | "admin_message";

// Shared helper — every module that needs to notify a user goes through here rather than
// creating NotificationModel docs directly, so the shape stays consistent.
export async function notifyUser(userId: string, type: NotificationType, message: string, listingId?: string) {
  await NotificationModel.create({ userId, type, message, listingId: listingId || undefined });
}

// Notifies everyone who has wishlisted a listing — used for price-drop and back-in-stock
// alerts. Skips the listing owner (can't wishlist their own listing anyway, but defensive).
export async function notifyWishlisters(
  listingId: string,
  ownerId: string,
  type: "price_drop" | "listing_available",
  message: string
) {
  const entries = await WishlistModel.find({ listingId }, "userId");
  const recipients = entries.map((e) => e.userId.toString()).filter((id) => id !== ownerId);
  if (recipients.length === 0) return;
  await NotificationModel.insertMany(
    recipients.map((userId) => ({ userId, type, message, listingId }))
  );
}

// Broadcasts an admin-composed message to every user account. Used by the admin panel's
// "send notification" tool when no specific recipient is chosen. Batches via insertMany so a
// large user base doesn't trigger thousands of individual writes.
export async function notifyAllUsers(userIds: string[], message: string, listingId?: string) {
  if (userIds.length === 0) return;
  await NotificationModel.insertMany(
    userIds.map((userId) => ({ userId, type: "admin_message" as const, message, listingId: listingId || undefined }))
  );
}
