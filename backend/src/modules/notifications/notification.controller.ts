import type { Request, Response } from "express";
import { NotificationModel } from "./notification.model";

function toDTO(n: any) {
  return {
    id: n._id.toString(),
    type: n.type,
    message: n.message,
    listingId: n.listingId ? n.listingId.toString() : undefined,
    read: Boolean(n.readAt),
    createdAt: n.createdAt.toISOString(),
  };
}

export const notificationController = {
  // GET /notifications?page=&limit= — newest first.
  async list(req: Request, res: Response) {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20));

    const filter = { userId: req.user!.sub };
    const [total, notifications] = await Promise.all([
      NotificationModel.countDocuments(filter),
      NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    res.json({ notifications: notifications.map(toDTO), total, page, limit });
  },

  // GET /notifications/unread-count
  async unreadCount(req: Request, res: Response) {
    const count = await NotificationModel.countDocuments({ userId: req.user!.sub, readAt: null });
    res.json({ count });
  },

  // PATCH /notifications/:id/read
  async markRead(req: Request, res: Response) {
    await NotificationModel.updateOne(
      { _id: req.params.id, userId: req.user!.sub },
      { $set: { readAt: new Date() } }
    );
    res.json({ read: true });
  },

  // PATCH /notifications/read-all
  async markAllRead(req: Request, res: Response) {
    await NotificationModel.updateMany(
      { userId: req.user!.sub, readAt: null },
      { $set: { readAt: new Date() } }
    );
    res.json({ read: true });
  },
};
