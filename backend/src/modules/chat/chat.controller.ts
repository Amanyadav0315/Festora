import type { Request, Response } from "express";
import { ConversationModel, pairKeyFor } from "./conversation.model";
import { MessageModel } from "./message.model";
import { UserModel } from "../users/user.model";
import { BlockModel } from "../social/block.model";
import { sendMessageSchema, editMessageSchema, listMessagesQuerySchema } from "./chat.schemas";
import { toMessageDTO } from "./chat.mapper";
import { chatImageUrl } from "../../middleware/upload";
import { ApiError } from "../../middleware/errorHandler";

const REPLY_PREVIEW_SELECT = "senderId text imageUrl deletedForEveryone";

async function getOwnedConversation(conversationId: string, userId: string) {
  const conversation = await ConversationModel.findById(conversationId);
  if (!conversation) throw new ApiError(404, "Conversation not found");
  if (!conversation.participants.some((p) => p.toString() === userId)) {
    throw new ApiError(403, "You are not part of this conversation");
  }
  return conversation;
}

async function assertNotBlocked(userId: string, otherId: string) {
  const blocked = await BlockModel.findOne({
    $or: [
      { blockerId: userId, blockedId: otherId },
      { blockerId: otherId, blockedId: userId },
    ],
  });
  if (blocked) throw new ApiError(403, "You can't message this user");
}

export const chatController = {
  // GET /chats — every conversation the current user is part of, newest first.
  async listConversations(req: Request, res: Response) {
    const userId = req.user!.sub;
    const conversations = await ConversationModel.find({ participants: userId }).sort({ lastMessageAt: -1 });

    const results = await Promise.all(
      conversations.map(async (c) => {
        const otherId = c.participants.find((p) => p.toString() !== userId)!;
        const other = await UserModel.findById(otherId, "name");
        const unreadCount = await MessageModel.countDocuments({
          conversationId: c._id,
          senderId: { $ne: userId },
          readBy: { $ne: userId },
          deletedFor: { $ne: userId },
        });
        return {
          id: c._id.toString(),
          otherUser: { id: otherId.toString(), name: other?.name ?? "Deleted user" },
          lastMessageText: c.lastMessageText ?? undefined,
          lastMessageAt: c.lastMessageAt.toISOString(),
          unreadCount,
        };
      })
    );

    res.json({ conversations: results });
  },

  // GET /chats/:conversationId — basic info (who the other participant is) for the header.
  async getConversation(req: Request, res: Response) {
    const userId = req.user!.sub;
    const conversation = await getOwnedConversation(req.params.conversationId, userId);
    const otherId = conversation.participants.find((p) => p.toString() !== userId)!;
    const other = await UserModel.findById(otherId, "name");
    res.json({
      id: conversation._id.toString(),
      otherUser: { id: otherId.toString(), name: other?.name ?? "Deleted user" },
    });
  },

  // GET /chats/with/:userId — find or create the conversation with a specific user.
  async getOrCreateWithUser(req: Request, res: Response) {
    const userId = req.user!.sub;
    const otherId = req.params.userId;
    if (otherId === userId) throw new ApiError(400, "You cannot message yourself");

    const other = await UserModel.findById(otherId);
    if (!other) throw new ApiError(404, "User not found");
    await assertNotBlocked(userId, otherId);

    const pairKey = pairKeyFor(userId, otherId);
    const conversation = await ConversationModel.findOneAndUpdate(
      { pairKey },
      { $setOnInsert: { pairKey, participants: [userId, otherId] } },
      { upsert: true, new: true }
    );

    res.json({ conversationId: conversation._id.toString() });
  },

  // GET /chats/:conversationId/messages?before=&limit=
  async listMessages(req: Request, res: Response) {
    const userId = req.user!.sub;
    const conversation = await getOwnedConversation(req.params.conversationId, userId);
    const query = listMessagesQuerySchema.parse(req.query);

    const filter: Record<string, unknown> = { conversationId: conversation._id, deletedFor: { $ne: userId } };
    if (query.before) {
      const cursor = await MessageModel.findById(query.before);
      if (cursor) filter.createdAt = { $lt: cursor.createdAt };
    }

    const messages = await MessageModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(query.limit)
      .populate("replyToId", REPLY_PREVIEW_SELECT);

    res.json({ messages: messages.reverse().map((m) => toMessageDTO(m, userId)) });
  },

  // POST /chats/:conversationId/messages — text message (optionally replying to another).
  async sendMessage(req: Request, res: Response) {
    const userId = req.user!.sub;
    const conversation = await getOwnedConversation(req.params.conversationId, userId);
    const input = sendMessageSchema.parse(req.body);
    if (!input.text) throw new ApiError(400, "Message cannot be empty");

    const otherId = conversation.participants.find((p) => p.toString() !== userId)!.toString();
    await assertNotBlocked(userId, otherId);

    if (input.replyToId) {
      const replyTo = await MessageModel.findOne({ _id: input.replyToId, conversationId: conversation._id });
      if (!replyTo) throw new ApiError(404, "Message being replied to was not found");
    }

    const message = await MessageModel.create({
      conversationId: conversation._id,
      senderId: userId,
      text: input.text,
      replyToId: input.replyToId,
      readBy: [userId],
    });
    await message.populate("replyToId", REPLY_PREVIEW_SELECT);

    conversation.lastMessageAt = new Date();
    conversation.lastMessageText = input.text.slice(0, 120);
    await conversation.save();

    res.status(201).json({ message: toMessageDTO(message, userId) });
  },

  // POST /chats/:conversationId/messages/image — a shared image, with an optional caption.
  async sendImageMessage(req: Request, res: Response) {
    const userId = req.user!.sub;
    const conversation = await getOwnedConversation(req.params.conversationId, userId);
    const file = req.file;
    if (!file) throw new ApiError(400, "Image is required");

    const otherId = conversation.participants.find((p) => p.toString() !== userId)!.toString();
    await assertNotBlocked(userId, otherId);

    const text = typeof req.body.text === "string" && req.body.text.trim() ? req.body.text.trim() : undefined;
    const message = await MessageModel.create({
      conversationId: conversation._id,
      senderId: userId,
      text,
      imageUrl: chatImageUrl(file.filename),
      readBy: [userId],
    });

    conversation.lastMessageAt = new Date();
    conversation.lastMessageText = text ?? "📷 Photo";
    await conversation.save();

    res.status(201).json({ message: toMessageDTO(message, userId) });
  },

  // PATCH /chats/messages/:messageId — edit own text message.
  async editMessage(req: Request, res: Response) {
    const userId = req.user!.sub;
    const message = await MessageModel.findById(req.params.messageId);
    if (!message) throw new ApiError(404, "Message not found");
    if (message.senderId.toString() !== userId) throw new ApiError(403, "You can only edit your own messages");
    if (message.deletedForEveryone) throw new ApiError(400, "This message was deleted");
    if (message.imageUrl && !message.text) throw new ApiError(400, "Photos can't be edited");

    const input = editMessageSchema.parse(req.body);
    message.text = input.text;
    message.editedAt = new Date();
    await message.save();
    await message.populate("replyToId", REPLY_PREVIEW_SELECT);

    res.json({ message: toMessageDTO(message, userId) });
  },

  // DELETE /chats/messages/:messageId?forEveryone=true
  async deleteMessage(req: Request, res: Response) {
    const userId = req.user!.sub;
    const message = await MessageModel.findById(req.params.messageId);
    if (!message) throw new ApiError(404, "Message not found");

    const forEveryone = req.query.forEveryone === "true";
    if (forEveryone) {
      if (message.senderId.toString() !== userId) {
        throw new ApiError(403, "You can only delete your own messages for everyone");
      }
      message.deletedForEveryone = true;
      message.text = undefined;
      message.imageUrl = undefined;
      await message.save();
    } else {
      if (!message.deletedFor.some((id) => id.toString() === userId)) {
        message.deletedFor.push(userId as any);
        await message.save();
      }
    }

    res.json({ deleted: true, forEveryone });
  },

  // GET /chats/:conversationId/media — every image shared in this conversation, newest first.
  async listMedia(req: Request, res: Response) {
    const userId = req.user!.sub;
    const conversation = await getOwnedConversation(req.params.conversationId, userId);
    const messages = await MessageModel.find({
      conversationId: conversation._id,
      imageUrl: { $ne: null },
      deletedForEveryone: false,
      deletedFor: { $ne: userId },
    })
      .sort({ createdAt: -1 })
      .select("imageUrl senderId createdAt");

    res.json({
      media: messages.map((m) => ({
        id: m._id.toString(),
        imageUrl: m.imageUrl,
        senderId: m.senderId.toString(),
        createdAt: m.createdAt.toISOString(),
      })),
    });
  },

  // PATCH /chats/:conversationId/read — mark every message in the conversation as read by me.
  async markRead(req: Request, res: Response) {
    const userId = req.user!.sub;
    const conversation = await getOwnedConversation(req.params.conversationId, userId);
    await MessageModel.updateMany(
      { conversationId: conversation._id, senderId: { $ne: userId }, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );
    res.json({ read: true });
  },
};
