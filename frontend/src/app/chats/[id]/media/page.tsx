"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ChatMediaItemDTO } from "@eventsaman/types";
import { getAccessToken, getUser } from "@/lib/auth-client";
import { apiFetch, ApiRequestError, ASSET_BASE_URL } from "@/lib/api";
import { BackHeader } from "@/components/BackHeader";

function imgSrc(src: string) {
  return src.startsWith("http") ? src : `${ASSET_BASE_URL}${src}`;
}

export default function ChatMediaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [media, setMedia] = useState<ChatMediaItemDTO[] | null>(null);
  const [error, setError] = useState("");
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!getUser() || !token) {
      router.push("/login");
      return;
    }
    apiFetch<{ media: ChatMediaItemDTO[] }>(`/chats/${params.id}/media`, { accessToken: token })
      .then((body) => setMedia(body.media))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong"));
  }, [params.id, router]);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 pb-12 sm:px-6">
      <BackHeader title="Shared media" backHref={`/chats/${params.id}`} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {media === null && !error ? (
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-md bg-gray-200" />
          ))}
        </div>
      ) : media && media.length === 0 ? (
        <div className="mt-6 rounded-xl border border-gray-100 bg-white px-4 py-14 text-center shadow-sm">
          <p className="text-sm text-gray-500">No photos shared in this chat yet.</p>
        </div>
      ) : (
        media && (
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
            {media.map((m, idx) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPreviewIdx(idx)}
                className="aspect-square overflow-hidden rounded-md bg-gray-100"
              >
                <img src={imgSrc(m.imageUrl)} alt="Shared" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )
      )}

      {media && previewIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreviewIdx(null)}
        >
          <img
            src={imgSrc(media[previewIdx].imageUrl)}
            alt="Shared"
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </main>
  );
}
