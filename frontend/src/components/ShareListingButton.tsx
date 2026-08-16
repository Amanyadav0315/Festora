"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ShareSheet } from "@/components/ShareSheet";

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path strokeLinecap="round" d="M8.6 10.5l6.8-3.8M8.6 13.5l6.8 3.8" />
    </svg>
  );
}

export function ShareListingButton({
  title,
  url: urlOverride,
  className,
}: {
  title: string;
  url?: string;
  className?: string;
}) {
  const t = useTranslations("share");
  const [open, setOpen] = useState(false);

  const url = urlOverride ?? (typeof window !== "undefined" ? window.location.href : "");

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          // Guards against this being rendered inside a card that's itself a <Link> — without
          // this, opening the sheet would also navigate.
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={t("button")}
        className={className ?? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-orange-600 hover:bg-orange-50"}
      >
        <ShareIcon className="h-4.5 w-4.5" />
      </button>

      {open && <ShareSheet title={title} url={url} onClose={() => setOpen(false)} />}
    </>
  );
}
