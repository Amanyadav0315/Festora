"use client";

import { useRef, useState } from "react";
import { ASSET_BASE_URL } from "@/lib/api";

function resolveImageUrl(src: string) {
  return src.startsWith("http") ? src : `${ASSET_BASE_URL}${src}`;
}

export function ImageCarousel({
  images,
  alt,
  aspect = "aspect-[4/3]",
  showThumbnails = false,
}: {
  images: string[];
  alt: string;
  aspect?: string;
  showThumbnails?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const shown = images.length > 0 ? images.map(resolveImageUrl) : ["/placeholder-listing.svg"];

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    setActive(index);
  }

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    const track = trackRef.current;
    if (!track || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    e.preventDefault();
    track.scrollBy({ left: e.deltaY, behavior: "smooth" });
  }

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  return (
    <div>
      <div className="group relative overflow-hidden rounded-lg bg-gray-100">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          onWheel={handleWheel}
          className={`flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth ${aspect}`}
          style={{ scrollbarWidth: "none" }}
        >
          {shown.map((src, i) => (
            <div key={`${src}-${i}`} className="relative h-full w-full shrink-0 snap-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${alt} ${i + 1}`}
                draggable={false}
                className="relative h-full w-full object-contain"
              />
            </div>
          ))}
        </div>

        {shown.length > 1 && (
          <>
            {active > 0 && (
              <button
                type="button"
                aria-label="Previous photo"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goTo(active - 1);
                }}
                className="absolute left-1.5 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 sm:flex"
              >
                <ChevronIcon direction="left" />
              </button>
            )}
            {active < shown.length - 1 && (
              <button
                type="button"
                aria-label="Next photo"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goTo(active + 1);
                }}
                className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 sm:flex"
              >
                <ChevronIcon direction="right" />
              </button>
            )}
            <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white sm:hidden">
              {active + 1}/{shown.length}
            </span>
            <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5 sm:hidden">
              {shown.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === active ? "w-4 bg-white" : "w-1.5 bg-white/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {showThumbnails && shown.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {shown.map((src, i) => (
            <button
              key={`${src}-thumb-${i}`}
              type="button"
              aria-label={`View photo ${i + 1}`}
              onClick={() => goTo(i)}
              className={`aspect-square h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                i === active ? "border-orange-500" : "border-transparent opacity-80 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${alt} thumbnail ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"}
      />
    </svg>
  );
}
