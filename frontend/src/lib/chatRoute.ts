// Chat thread screens (the conversation itself, and its media view) take over the full
// viewport like a native chat app — no top navbar, no bottom tab bar — since they already
// ship their own header with a back button. Only "/chats" (the conversation list) keeps the
// normal site chrome.
export function isChatThreadPath(pathname: string): boolean {
  return /^\/chats\/[^/]+/.test(pathname);
}
