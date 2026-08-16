"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ListingDTO } from "@eventsaman/types";
import { ImageCarousel } from "@/components/ImageCarousel";
import { SellerAvatar } from "@/components/SellerAvatar";
import { WishlistButton } from "@/components/WishlistButton";
import { CompareButton } from "@/components/CompareButton";
import { ShareListingButton } from "@/components/ShareListingButton";

function formatPrice(price: number, priceUnit?: string) {
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
  return priceUnit ? `${formatted} / ${priceUnit.replace(/^per /, "")}` : formatted;
}

export function ListingCard({ listing }: { listing: ListingDTO }) {
  const router = useRouter();

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="relative block rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Image corners are clipped here rather than on the card itself, so the share menu's
          dropdown (rendered as a sibling, positioned relative to the card) isn't clipped by an
          ancestor's overflow-hidden. */}
      <div className="relative w-full overflow-hidden rounded-t-xl bg-gray-100">
        <ImageCarousel images={listing.images} alt={listing.title} />
        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1.5">
          <WishlistButton listingId={listing.id} />
          <CompareButton listingId={listing.id} />
        </div>
        <span className="absolute right-2 top-2 z-10 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-orange-600 shadow-sm">
          {listing.purpose === "rent" ? "For rent" : "For sale"}
        </span>
      </div>
      <div className="absolute right-2 top-11 z-20">
        <ShareListingButton
          title={listing.title}
          url={typeof window !== "undefined" ? `${window.location.origin}/listings/${listing.id}` : `/listings/${listing.id}`}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-orange-600 shadow-sm backdrop-blur hover:bg-orange-50"
        />
      </div>
      <div className="p-2 sm:p-3">
        <p className="text-sm font-semibold text-gray-900 sm:text-base">{formatPrice(listing.price, listing.priceUnit)}</p>
        <p className="mt-1 truncate text-xs text-gray-700 sm:text-sm">{listing.title}</p>
        {listing.ownerId ? (
          <span
            role="link"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(`/u/${listing.ownerId}`);
            }}
            className="relative z-10 mt-1 flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-600"
          >
            <SellerAvatar name={listing.storeName} avatarUrl={listing.ownerAvatarUrl} />
            <span className="truncate hover:underline">{listing.storeName}</span>
          </span>
        ) : (
          <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-gray-500">
            <SellerAvatar name={listing.storeName} avatarUrl={listing.ownerAvatarUrl} />
            {listing.storeName}
          </p>
        )}
        {listing.city && <p className="text-xs text-gray-400">{listing.city}</p>}
      </div>
    </Link>
  );
}
