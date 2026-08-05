"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function BrowseDropdown({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const t = useTranslations("navbar");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = [
    { label: t("browseAll"), href: "/browse" },
    { label: t("browseNew"), href: "/browse?condition=new" },
    { label: t("browseUsed"), href: "/browse?condition=old" },
  ];

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={
          compact
            ? "flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700"
            : "flex items-center gap-1.5 rounded-full border border-gray-300 px-3.5 py-1.5 text-sm font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50"
        }
      >
        {t("browse")}
        <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-40 mt-2 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          {options.map((opt) => (
            <button
              key={opt.href}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                router.push(opt.href);
              }}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
