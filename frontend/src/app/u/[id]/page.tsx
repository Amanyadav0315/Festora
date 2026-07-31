"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { ListingDTO, PublicUserProfileDTO } from "@festora/types";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-client";
import { BackHeader } from "@/components/BackHeader";
import { SocialProfile } from "@/components/SocialProfile";

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicUserProfileDTO | null>(null);
  const [listings, setListings] = useState<ListingDTO[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const token = getAccessToken() ?? undefined;
        const { profile: p } = await apiFetch<{ profile: PublicUserProfileDTO }>(`/users/${params.id}`, {
          accessToken: token,
        });
        if (cancelled) return;
        setProfile(p);

        if (p.store) {
          const { listings: l } = await apiFetch<{ listings: ListingDTO[] }>(
            `/listings?storeId=${p.store.id}&limit=50`
          );
          if (!cancelled) setListings(l);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (notFound) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-2 sm:px-6">
        <BackHeader title="Profile" />
        <p className="mt-6 text-sm text-gray-500">This user doesn&apos;t exist.</p>
      </main>
    );
  }

  if (!profile) return null;

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 pt-2 sm:px-6">
        <BackHeader title="Profile" />
      </div>
      <SocialProfile profile={profile} listings={listings} />
    </>
  );
}
