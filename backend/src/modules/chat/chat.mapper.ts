import type { MessageDTO } from "@eventsaman/types";

export function toMessageDTO(msg: any, viewerId: string): MessageDTO {
  const deletedForEveryone = !!msg.deletedForEveryone;
  const replyTo = msg.replyToId && typeof msg.replyToId === "object" ? msg.replyToId : null;

  return {
    id: msg._id.toString(),
    conversationId: msg.conversationId.toString(),
    senderId: msg.senderId.toString(),
    text: deletedForEveryone ? undefined : msg.text ?? undefined,
    imageUrl: deletedForEveryone ? undefined : msg.imageUrl ?? undefined,
    replyTo: replyTo
      ? {
          id: replyTo._id.toString(),
          senderId: replyTo.senderId.toString(),
          text: replyTo.deletedForEveryone ? undefined : replyTo.text ?? undefined,
          imageUrl: replyTo.deletedForEveryone ? undefined : replyTo.imageUrl ?? undefined,
        }
      : undefined,
    edited: !!msg.editedAt,
    deletedForEveryone,
    isMine: msg.senderId.toString() === viewerId,
    createdAt: msg.createdAt.toISOString(),
  };
}
