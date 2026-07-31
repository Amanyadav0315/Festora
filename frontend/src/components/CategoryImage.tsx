"use client";

import { useState } from "react";
import { ASSET_BASE_URL } from "@/lib/api";

export function CategoryImage({
  slug,
  name,
  imageUrl,
  className,
}: {
  slug: string;
  name: string;
  imageUrl?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const primarySrc = imageUrl ? `${ASSET_BASE_URL}${imageUrl}` : `/categories/${slug}.jpg`;

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-lg font-semibold text-gray-400 ${className ?? ""}`}>
        {name.charAt(0)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={primarySrc}
      alt={name}
      onError={() => setFailed(true)}
      className={`object-cover ${className ?? ""}`}
    />
  );
}