"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ListingDTO, PublicUserProfileDTO } from "@festora/types";
import { apiFetch } from "@/lib/api";
import { getAccessToken, getUser } from "@/lib/auth-client";
import { BackHeader } from "@/components/BackHeader";
import { SocialProfile } from "@/components/SocialProfile";

export default function AccountPage() {
  const router = useRouter();
  const t = useTranslations("socialProfile");
  const [profile, setProfile] = useState<PublicUserProfileDTO | null>(null);
  const [listings, setListings] = useState<ListingDTO[]>([]);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }

    let cancelled = false;
    async function load() {
      const token = getAccessToken() ?? undefined;
      const { profile: p } = await apiFetch<{ profile: PublicUserProfileDTO }>(`/users/${currentUser!.id}`, {
        accessToken: token,
      });
      if (cancelled) return;
      setProfile(p);

      if (p.store) {
        const { listings: l } = await apiFetch<{ listings: ListingDTO[] }>(`/listings?storeId=${p.store.id}&limit=50`);
        if (!cancelled) setListings(l);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!profile) return null;

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 pt-2 sm:px-6">
        <BackHeader title={t("yourProfile")} backHref="/profile" />
      </div>
      <SocialProfile profile={profile} listings={listings} />
    </>
  );
}
