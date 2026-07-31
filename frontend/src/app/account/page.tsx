"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { UserDTO } from "@festora/types";
import { getUser } from "@/lib/auth-client";
import { BackHeader } from "@/components/BackHeader";

export default function AccountPage() {
  const router = useRouter();
  const t = useTranslations("profileMenu");
  const [user, setUser] = useState<UserDTO | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push("/login");
      return;
    }
    setUser(u);
  }, [router]);

  if (!user) return null;

  const rows = [
    { label: t("editName"), value: user.name },
    { label: t("editPhone"), value: user.phone },
    { label: t("editEmail"), value: user.email || t("notProvided") },
    ...(user.role === "admin" ? [{ label: t("role"), value: t("adminRole") }] : []),
  ];

  return (
    <main className="mx-auto max-w-sm px-4 pb-10 sm:px-6 sm:pb-16">
      <BackHeader title={t("profileTitle")} backHref="/profile" />

      <div className="mt-2 flex items-center gap-3 px-1">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-orange-500 bg-orange-100 text-lg font-semibold text-orange-700">
          {user.name.trim().charAt(0).toUpperCase() || "U"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-gray-900">{user.name}</p>
          <p className="truncate text-sm text-gray-500">{user.phone}</p>
        </div>
      </div>

      <div className="mt-6 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {rows.map((row) => (
          <div key={row.label} className="px-4 py-3.5">
            <p className="text-xs font-medium text-gray-500">{row.label}</p>
            <p className="mt-1 text-sm text-gray-900">{row.value}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-gray-400">{t("comingSoon")}</p>
    </main>
  );
}
