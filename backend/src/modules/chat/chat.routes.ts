import { Router } from "express";
import { chatController } from "./chat.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { uploadChatImage } from "../../middleware/upload";

export const chatRouter = Router();

chatRouter.use(requireAuth);

chatRouter.get("/", asyncHandler(chatController.listConversations));
chatRouter.get("/with/:userId", asyncHandler(chatController.getOrCreateWithUser));
chatRouter.get("/:conversationId/messages", asyncHandler(chatController.listMessages));
chatRouter.get("/:conversationId/media", asyncHandler(chatController.listMedia));
chatRouter.get("/:conversationId", asyncHandler(chatController.getConversation));
chatRouter.post("/:conversationId/messages", asyncHandler(chatController.sendMessage));
chatRouter.post(
  "/:conversationId/messages/image",
  uploadChatImage.single("image"),
  asyncHandler(chatController.sendImageMessage)
);
chatRouter.patch("/:conversationId/read", asyncHandler(chatController.markRead));
chatRouter.patch("/messages/:messageId", asyncHandler(chatController.editMessage));
chatRouter.delete("/messages/:messageId", asyncHandler(chatController.deleteMessage));
