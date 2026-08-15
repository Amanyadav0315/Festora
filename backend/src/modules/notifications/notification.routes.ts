import { Router } from "express";
import { notificationController } from "./notification.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get("/", asyncHandler(notificationController.list));
notificationRouter.get("/unread-count", asyncHandler(notificationController.unreadCount));
notificationRouter.patch("/read-all", asyncHandler(notificationController.markAllRead));
notificationRouter.patch("/:id/read", asyncHandler(notificationController.markRead));
