"use client";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.35 5.07L2 22l5.09-1.33A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18.15c-1.66 0-3.2-.47-4.5-1.28l-.32-.19-3.02.79.8-2.95-.21-.31A8.14 8.14 0 0 1 3.85 12c0-4.5 3.65-8.15 8.15-8.15S20.15 7.5 20.15 12 16.5 20.15 12 20.15zm4.52-6.13c-.25-.12-1.45-.71-1.68-.8-.22-.08-.39-.12-.55.12-.16.25-.63.8-.78.96-.14.16-.29.18-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.42-.14 0-.31-.02-.47-.02-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.16 1.73 2.65 4.2 3.71.59.25 1.05.4 1.41.51.59.19 1.13.16 1.55.1.47-.07 1.45-.59 1.66-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.47-.28z" />
    </svg>
  );
}

// WhatsApp is by far the dominant channel Indian buyers/sellers already use to coordinate —
// a direct wa.me deep link (no API/business account needed) opens straight into a chat with
// the listing link pre-filled.
export function ShareListingButton({ title, className }: { title: string; className?: string }) {
  function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = encodeURIComponent(`${title} — ${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Share on WhatsApp"
      className={className ?? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-emerald-600 hover:bg-emerald-50"}
    >
      <WhatsAppIcon className="h-4.5 w-4.5" />
    </button>
  );
}
