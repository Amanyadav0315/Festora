"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.35 5.07L2 22l5.09-1.33A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18.15c-1.66 0-3.2-.47-4.5-1.28l-.32-.19-3.02.79.8-2.95-.21-.31A8.14 8.14 0 0 1 3.85 12c0-4.5 3.65-8.15 8.15-8.15S20.15 7.5 20.15 12 16.5 20.15 12 20.15zm4.52-6.13c-.25-.12-1.45-.71-1.68-.8-.22-.08-.39-.12-.55.12-.16.25-.63.8-.78.96-.14.16-.29.18-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.42-.14 0-.31-.02-.47-.02-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.16 1.73 2.65 4.2 3.71.59.25 1.05.4 1.41.51.59.19 1.13.16 1.55.1.47-.07 1.45-.59 1.66-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.47-.28z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M21.9 4.4a1.3 1.3 0 0 0-1.35-.22L2.9 11.02c-.98.38-.97 1.78.02 2.14l4.4 1.58 1.7 5.46c.19.6.94.78 1.38.33l2.5-2.55 4.55 3.35c.63.47 1.53.13 1.7-.63l3.14-14.36c.12-.55-.08-1.02-.39-1.4zM9.9 14.5l-1.02 3.27-1.13-3.64 9.9-6.14L9.9 14.5z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.93 8.44-9.94z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="18" height="18" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SmsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H9l-4.5 4V16H4a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1z"
      />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 15l6-6m-5-2l.5-.5a3.5 3.5 0 015 5L15 12m-6 2l-.5.5a3.5 3.5 0 01-5-5L4 8"
      />
    </svg>
  );
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

// Full-screen (mobile) / centered (desktop) share sheet with a grid of recognizable app icons
// in their own brand colors — used for both listing and profile sharing. Every link is a plain
// deep-link URL (no API keys, no business accounts, nothing paid).
export function ShareSheet({
  title,
  url,
  onClose,
}: {
  title: string;
  url: string;
  onClose: () => void;
}) {
  const t = useTranslations("share");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const text = `${title} — ${url}`;

  function openLink(href: string) {
    window.open(href, "_blank", "noopener,noreferrer");
    onClose();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard API can fail on non-secure contexts — nothing meaningful to do beyond ignoring.
    }
  }

  async function shareInstagram() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        onClose();
        return;
      } catch {
        return;
      }
    }
    await copyLink();
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  }

  async function shareSystem() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        onClose();
      } catch {
        // User cancelled — nothing further to do.
      }
    }
  }

  const apps = [
    {
      key: "whatsapp",
      label: t("whatsapp"),
      icon: WhatsAppIcon,
      bg: "bg-[#25D366]",
      onClick: () => openLink(`https://wa.me/?text=${encodeURIComponent(text)}`),
    },
    {
      key: "telegram",
      label: t("telegram"),
      icon: TelegramIcon,
      bg: "bg-[#26A5E4]",
      onClick: () => openLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`),
    },
    {
      key: "instagram",
      label: t("instagram"),
      icon: InstagramIcon,
      bg: "bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]",
      onClick: shareInstagram,
    },
    {
      key: "facebook",
      label: t("facebook"),
      icon: FacebookIcon,
      bg: "bg-[#1877F2]",
      onClick: () => openLink(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`),
    },
    {
      key: "sms",
      label: t("sms"),
      icon: SmsIcon,
      bg: "bg-gray-500",
      onClick: () => openLink(`sms:?body=${encodeURIComponent(text)}`),
    },
    {
      key: "more",
      label: t("moreApps"),
      icon: MoreIcon,
      bg: "bg-gray-400",
      onClick: shareSystem,
      hidden: typeof navigator === "undefined" || !navigator.share,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={(e) => {
        // Guards against being rendered inside a card that's itself a <Link> — without this,
        // clicking the backdrop (or anything inside) would also trigger card navigation.
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:rounded-3xl sm:pb-6"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-gray-200 sm:hidden" />
        <div className="flex items-center justify-between px-5 pt-2">
          <h3 className="text-base font-bold text-gray-900">{t("shareVia")}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <CloseIcon className="h-4.5 w-4.5" />
          </button>
        </div>
        <p className="mt-1 truncate px-5 text-xs text-gray-400">{title}</p>

        <div className="mt-4 grid grid-cols-4 gap-y-4 px-5 sm:grid-cols-5">
          {apps
            .filter((a) => !a.hidden)
            .map(({ key, label, icon: Icon, bg, onClick }) => (
              <button
                key={key}
                type="button"
                onClick={onClick}
                className="flex flex-col items-center gap-1.5 text-center"
              >
                <span className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-sm ${bg}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className="max-w-[4.2rem] truncate text-[11px] text-gray-600">{label}</span>
              </button>
            ))}
        </div>

        <div className="mt-5 px-5">
          <button
            type="button"
            onClick={copyLink}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-3.5 py-3 text-left text-sm font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <LinkIcon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 truncate">{url}</span>
            <span className="shrink-0 text-xs font-semibold text-orange-600">{copied ? t("linkCopied") : t("copyLink")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
