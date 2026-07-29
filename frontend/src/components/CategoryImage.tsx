"use client";

import { useState } from "react";

export function CategoryImage({ slug, name, className }: { slug: string; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);

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
      src={`/categories/${slug}.jpg`}
      alt={name}
      onError={() => setFailed(true)}
      className={`object-cover ${className ?? ""}`}
    />
  );
}