"use client";

import { useState } from "react";
import { ASSET_BASE_URL } from "@/lib/api";

export function CategoryImage({
  name,
  imageUrl,
  className,
}: {
  name: string;
  imageUrl?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-lg font-semibold text-gray-400 ${className ?? ""}`}>
        {name.charAt(0)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${ASSET_BASE_URL}${imageUrl}`}
      alt={name}
      onError={() => setFailed(true)}
      className={`object-cover ${className ?? ""}`}
    />
  );
}