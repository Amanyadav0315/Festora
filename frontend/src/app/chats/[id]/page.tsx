"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { ListingDTO, MessageDTO } from "@eventsaman/types";
import { getAccessToken, getUser } from "@/lib/auth-client";
import { apiFetch, apiUpload, ApiRequestError, ASSET_BASE_URL } from "@/lib/api";
import { ReportUserModal } from "@/components/ReportUserModal";

const POLL_INTERVAL_MS = 3000;
const IST = "Asia/Kolkata";

const AVATAR_GRADIENTS = [
  "from-orange-400 to-rose-400",
  "from-sky-400 to-indigo-400",
  "from-emerald-400 to-teal-400",
  "from-fuchsia-400 to-purple-400",
  "from-amber-400 to-orange-500",
];

function gradientFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[Math.abs(hash)];
}

function imgSrc(src: string) {
  return src.startsWith("http") ? src : `${ASSET_BASE_URL}${src}`;
}

// Every timestamp in chat is shown in real IST, regardless of the viewer's device timezone —
// matches WhatsApp's behaviour of showing "when it was actually sent", not local wall-clock.
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: IST });
}

// Calendar-day key in IST, used to decide when to insert a new date separator.
function istDayKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: IST }); // yyyy-mm-dd, stable sort key
}

function dateSeparatorLabel(iso: string) {
  const dayKey = istDayKey(iso);
  const todayKey = istDayKey(new Date().toISOString());
  const yesterdayKey = istDayKey(new Date(Date.now() - 86400000).toISOString());
  if (dayKey === todayKey) return "Today";
  if (dayKey === yesterdayKey) return "Yesterday";
  const d = new Date(iso);
  const sameYear = new Date().getFullYear() === d.getFullYear();
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: sameYear ? undefined : "numeric",
    timeZone: IST,
  });
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ReplyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 10l-5 5 5 5M4 15h11a5 5 0 0 0 0-10h-1" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 16l-5.5-5.5a2 2 0 0 0-2.8 0L4 19" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M3 11.5l17.5-8-6.4 17.5-3-6.9-6.9-3z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="8" r="3.5" />
      <path strokeLinecap="round" d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v18M5 4h11l-2.5 4L16 12H5" />
    </svg>
  );
}

function BlockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M6 6l12 12" />
    </svg>
  );
}

function ReplyPreviewLine({ msg, myId }: { msg: NonNullable<MessageDTO["replyTo"]>; myId: string }) {
  return (
    <div className="mb-1 truncate rounded-md border-l-2 border-orange-400 bg-black/5 px-2 py-1 text-xs opacity-90">
      <span className="font-semibold">{msg.senderId === myId ? "You" : ""}</span>{" "}
      {msg.text ? msg.text : msg.imageUrl ? "📷 Photo" : "Deleted message"}
    </div>
  );
}

// Shown at the top of the message that started a "message seller about this listing" chat, so
// the recipient can see exactly which post the conversation is about, on both sides of the chat.
function ListingContextCard({ listing, mine }: { listing: NonNullable<MessageDTO["listingContext"]>; mine: boolean }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      onClick={(e) => e.stopPropagation()}
      className={`mb-1.5 flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
        mine ? "border-white/25 bg-white/10" : "border-gray-200 bg-gray-50"
      }`}
    >
      {listing.image ? (
        <img src={imgSrc(listing.image)} alt={listing.title} className="h-10 w-10 shrink-0 rounded-md object-cover" />
      ) : (
        <div className={`h-10 w-10 shrink-0 rounded-md ${mine ? "bg-white/20" : "bg-gray-200"}`} />
      )}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-xs font-semibold ${mine ? "text-white" : "text-gray-900"}`}>{listing.title}</p>
        <p className={`text-[11px] ${mine ? "text-orange-100" : "text-gray-500"}`}>
          ₹{listing.price.toLocaleString("en-IN")}
          {listing.priceUnit ? ` / ${listing.priceUnit.replace(/^per /, "")}` : ""}
          {!listing.isActive ? " · No longer available" : ""}
        </p>
      </div>
    </Link>
  );
}

function DaySeparator({ label }: { label: string }) {
  return (
    <div className="my-3 flex items-center justify-center">
      <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-gray-500 shadow-sm">
        {label}
      </span>
    </div>
  );
}

export default function ChatThreadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = params.id;
  const initialListingId = searchParams.get("listingId") ?? undefined;

  const [otherUser, setOtherUser] = useState<{ id: string; name: string } | null>(null);
  const [pendingListingId, setPendingListingId] = useState<string | undefined>(initialListingId);
  const [pendingListing, setPendingListing] = useState<ListingDTO | null>(null);
  const [messages, setMessages] = useState<MessageDTO[] | null>(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTarget, setReplyTarget] = useState<MessageDTO | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const myId = getUser()?.id ?? "";
  const token = getAccessToken() ?? undefined;

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  const loadMessages = useCallback(async () => {
    if (!token) return;
    const wasNearBottom = isNearBottom();
    try {
      const body = await apiFetch<{ messages: MessageDTO[] }>(`/chats/${conversationId}/messages?limit=100`, {
        accessToken: token,
      });
      setMessages(body.messages);
      if (wasNearBottom) scrollToBottom();
      apiFetch(`/chats/${conversationId}/read`, { method: "PATCH", accessToken: token }).catch(() => {});
    } catch (err) {
      if (err instanceof ApiRequestError && (err.status === 403 || err.status === 404)) {
        setError(err.message);
      }
    }
  }, [conversationId, token, isNearBottom, scrollToBottom]);

  useEffect(() => {
    if (!getUser() || !token) {
      router.push("/login");
      return;
    }

    apiFetch<{ id: string; otherUser: { id: string; name: string } }>(`/chats/${conversationId}`, {
      accessToken: token,
    })
      .then((body) => setOtherUser(body.otherUser))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong"));

    loadMessages().then(scrollToBottom);
    const interval = setInterval(loadMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    if (!pendingListingId || !token) return;
    apiFetch<{ listing: ListingDTO }>(`/listings/${pendingListingId}`, { accessToken: token })
      .then((body) => setPendingListing(body.listing))
      .catch(() => setPendingListingId(undefined));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingListingId]);

  useEffect(() => {
    function onDocClick() {
      setHeaderMenuOpen(false);
    }
    if (headerMenuOpen) {
      document.addEventListener("click", onDocClick);
      return () => document.removeEventListener("click", onDocClick);
    }
  }, [headerMenuOpen]);

  function startReply(msg: MessageDTO) {
    setEditingId(null);
    setReplyTarget(msg);
    setActiveMenuId(null);
  }

  function startEdit(msg: MessageDTO) {
    setReplyTarget(null);
    setEditingId(msg.id);
    setText(msg.text ?? "");
    setActiveMenuId(null);
  }

  function cancelCompose() {
    setReplyTarget(null);
    setEditingId(null);
    setText("");
  }

  async function handleDelete(msg: MessageDTO, forEveryone: boolean) {
    if (!token) return;
    const confirmed = window.confirm(
      forEveryone ? "Delete this message for everyone?" : "Delete this message for you?"
    );
    if (!confirmed) return;
    setActiveMenuId(null);
    try {
      await apiFetch(`/chats/messages/${msg.id}?forEveryone=${forEveryone}`, {
        method: "DELETE",
        accessToken: token,
      });
      setMessages((prev) => {
        if (!prev) return prev;
        if (forEveryone) {
          return prev.map((m) =>
            m.id === msg.id ? { ...m, deletedForEveryone: true, text: undefined, imageUrl: undefined } : m
          );
        }
        return prev.filter((m) => m.id !== msg.id);
      });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    }
  }

  function pickImage() {
    fileInputRef.current?.click();
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setEditingId(null);
    setPendingImage(file);
    setPendingImagePreview(URL.createObjectURL(file));
  }

  function cancelImage() {
    if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
    setPendingImage(null);
    setPendingImagePreview(null);
  }

  async function handleSend() {
    if (!token || sending) return;
    const trimmed = text.trim();

    if (!trimmed && !pendingImage) return;
    setSending(true);
    setError("");

    try {
      if (editingId) {
        const body = await apiFetch<{ message: MessageDTO }>(`/chats/messages/${editingId}`, {
          method: "PATCH",
          accessToken: token,
          body: JSON.stringify({ text: trimmed }),
        });
        setMessages((prev) => (prev ? prev.map((m) => (m.id === editingId ? body.message : m)) : prev));
        cancelCompose();
      } else if (pendingImage) {
        const formData = new FormData();
        formData.append("image", pendingImage);
        if (trimmed) formData.append("text", trimmed);
        const body = await apiUpload<{ message: MessageDTO }>(`/chats/${conversationId}/messages/image`, formData, {
          accessToken: token,
        });
        setMessages((prev) => (prev ? [...prev, body.message] : [body.message]));
        cancelImage();
        setText("");
        scrollToBottom();
      } else {
        const body = await apiFetch<{ message: MessageDTO }>(`/chats/${conversationId}/messages`, {
          method: "POST",
          accessToken: token,
          body: JSON.stringify({ text: trimmed, replyToId: replyTarget?.id, listingId: pendingListingId }),
        });
        setMessages((prev) => (prev ? [...prev, body.message] : [body.message]));
        setReplyTarget(null);
        setPendingListingId(undefined);
        setPendingListing(null);
        setText("");
        scrollToBottom();
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  async function handleBlock() {
    if (!token || !otherUser || blockBusy) return;
    if (!window.confirm(`Block ${otherUser.name}? You won't be able to message each other anymore.`)) return;
    setBlockBusy(true);
    try {
      await apiFetch(`/social/block/${otherUser.id}`, { method: "POST", accessToken: token });
      setBlocked(true);
      setHeaderMenuOpen(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setBlockBusy(false);
    }
  }

  const initial = otherUser?.name.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="fixed inset-0 z-40 bg-[#efe9e0] lg:flex lg:justify-center lg:bg-gray-200 lg:py-6">
    <main className="flex h-full w-full flex-col bg-[#efe9e0] lg:max-w-2xl lg:rounded-xl lg:border lg:border-gray-200 lg:shadow-sm">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 rounded-t-xl border-b border-gray-200 bg-white px-3 py-2.5 sm:px-5">
        <button
          type="button"
          onClick={() => router.push("/chats")}
          aria-label="Back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
        >
          <BackIcon className="h-5 w-5" />
        </button>

        <div className="relative min-w-0 flex-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setHeaderMenuOpen((v) => !v);
            }}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-1 pr-2 text-left hover:bg-gray-50"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white shadow-sm ${gradientFor(
                otherUser?.name ?? ""
              )}`}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{otherUser?.name ?? "Chat"}</p>
              {blocked && <p className="text-[11px] text-red-500">Blocked</p>}
            </div>
          </button>

          {headerMenuOpen && otherUser && (
            <div
              className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <Link
                href={`/u/${otherUser.id}`}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <UserIcon className="h-4 w-4 text-gray-500" /> View profile
              </Link>
              <Link
                href={`/chats/${conversationId}/media`}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <GridIcon className="h-4 w-4 text-gray-500" /> Media
              </Link>
              <button
                onClick={() => {
                  setReportOpen(true);
                  setHeaderMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <FlagIcon className="h-4 w-4 text-gray-500" /> Report user
              </button>
              {!blocked && (
                <button
                  onClick={handleBlock}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <BlockIcon className="h-4 w-4" /> Block user
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {error && <p className="shrink-0 bg-red-50 px-4 py-1.5 text-xs text-red-600 sm:px-6">{error}</p>}

      {/* Messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3 pt-3 sm:px-6">
        {messages === null ? (
          <p className="mt-6 text-center text-sm text-gray-500">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="mt-6 text-center text-sm text-gray-500">Say hello 👋 to start the conversation.</p>
        ) : (
          messages.map((m, idx) => {
            const mine = m.senderId === myId;
            const menuOpen = activeMenuId === m.id;
            const prev = messages[idx - 1];
            const showSeparator = !prev || istDayKey(prev.createdAt) !== istDayKey(m.createdAt);
            return (
              <div key={m.id}>
                {showSeparator && <DaySeparator label={dateSeparatorLabel(m.createdAt)} />}
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                    <button
                      type="button"
                      onClick={() => !m.deletedForEveryone && setActiveMenuId(menuOpen ? null : m.id)}
                      className={`rounded-2xl px-3.5 py-2 text-left text-sm shadow-sm ${
                        m.deletedForEveryone
                          ? "bg-white italic text-gray-400"
                          : mine
                            ? "bg-orange-600 text-white"
                            : "bg-white text-gray-900"
                      }`}
                    >
                      {m.deletedForEveryone ? (
                        "This message was deleted"
                      ) : (
                        <>
                          {m.listingContext && <ListingContextCard listing={m.listingContext} mine={mine} />}
                          {m.replyTo && <ReplyPreviewLine msg={m.replyTo} myId={myId} />}
                          {m.imageUrl && (
                            <img
                              src={imgSrc(m.imageUrl)}
                              alt="Shared photo"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewImage(imgSrc(m.imageUrl!));
                              }}
                              className="mb-1 max-h-64 w-full cursor-zoom-in rounded-lg object-cover"
                            />
                          )}
                          {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                          <div
                            className={`mt-0.5 flex items-center justify-end gap-1 text-[10.5px] ${mine ? "text-orange-100" : "text-gray-400"}`}
                          >
                            {m.edited && <span className="italic">edited</span>}
                            <span>{formatTime(m.createdAt)}</span>
                          </div>
                        </>
                      )}
                    </button>

                    {menuOpen && !m.deletedForEveryone && (
                      <div className="mt-1 flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-white p-1 text-xs shadow-md">
                        <button
                          onClick={() => startReply(m)}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100"
                        >
                          <ReplyIcon className="h-3.5 w-3.5" /> Reply
                        </button>
                        {mine && m.text && !m.imageUrl && (
                          <button
                            onClick={() => startEdit(m)}
                            className="rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(m, false)}
                          className="rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100"
                        >
                          Delete for me
                        </button>
                        {mine && (
                          <button
                            onClick={() => handleDelete(m, true)}
                            className="rounded-md px-2 py-1 text-red-600 hover:bg-red-50"
                          >
                            Delete for everyone
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 rounded-b-xl border-t border-gray-200 bg-white px-3 pb-[calc(0.625rem+env(safe-area-inset-bottom))] pt-2.5 sm:px-6">
        {blocked ? (
          <p className="rounded-lg bg-gray-100 px-4 py-2.5 text-center text-sm text-gray-500">
            You've blocked this user. Unblock from their profile to send messages again.
          </p>
        ) : (
          <>
            {pendingListing && (
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2">
                {pendingListing.images[0] ? (
                  <img src={imgSrc(pendingListing.images[0])} alt={pendingListing.title} className="h-11 w-11 shrink-0 rounded-md object-cover" />
                ) : (
                  <div className="h-11 w-11 shrink-0 rounded-md bg-orange-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-gray-900">{pendingListing.title}</p>
                  <p className="text-[11px] text-orange-700">Sending with this post attached</p>
                </div>
                <button
                  onClick={() => {
                    setPendingListingId(undefined);
                    setPendingListing(null);
                  }}
                  aria-label="Remove listing"
                  className="shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            {replyTarget && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
                <div className="min-w-0 truncate text-gray-600">
                  Replying to {replyTarget.senderId === myId ? "yourself" : otherUser?.name}:{" "}
                  {replyTarget.text ?? (replyTarget.imageUrl ? "📷 Photo" : "")}
                </div>
                <button onClick={cancelCompose} aria-label="Cancel reply" className="shrink-0 text-gray-400 hover:text-gray-600">
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            {editingId && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
                <span className="text-gray-600">Editing message</span>
                <button onClick={cancelCompose} aria-label="Cancel edit" className="shrink-0 text-gray-400 hover:text-gray-600">
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            {pendingImagePreview && (
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                <img src={pendingImagePreview} alt="Selected" className="h-14 w-14 rounded-md object-cover" />
                <span className="flex-1 text-xs text-gray-500">Add a caption (optional) and send</span>
                <button onClick={cancelImage} aria-label="Remove image" className="shrink-0 text-gray-400 hover:text-gray-600">
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
              <button
                type="button"
                onClick={pickImage}
                aria-label="Share a photo"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
              >
                <ImageIcon className="h-5 w-5" />
              </button>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message..."
                rows={1}
                className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || (!text.trim() && !pendingImage)}
                aria-label="Send"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-40"
              >
                <SendIcon className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} alt="Shared" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}

      {reportOpen && otherUser && (
        <ReportUserModal
          targetId={otherUser.id}
          targetName={otherUser.name}
          conversationId={conversationId}
          accessToken={token}
          onClose={() => setReportOpen(false)}
        />
      )}
    </main>
    </div>
  );
}
