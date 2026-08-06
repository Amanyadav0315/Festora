import { apiFetch } from "./api";

// Finds (or lazily creates) the 1:1 conversation with a given user and returns its id.
export async function getOrCreateConversation(userId: string, accessToken: string): Promise<string> {
  const body = await apiFetch<{ conversationId: string }>(`/chats/with/${userId}`, { accessToken });
  return body.conversationId;
}
