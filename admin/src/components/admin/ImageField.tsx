"use client";

import { useState } from "react";
import { ASSET_BASE_URL } from "@/lib/api";

export function ImageField({
  currentImageUrl,
  onChange,
}: {
  currentImageUrl?: string;
  onChange: (file: File | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    onChange(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  const displayUrl = preview ?? (currentImageUrl ? `${ASSET_BASE_URL}${currentImageUrl}` : null);

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-gray-400">No image</span>
        )}
      </div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        className="text-xs text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-orange-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-orange-700 hover:file:bg-orange-100"
      />
    </div>
  );
}