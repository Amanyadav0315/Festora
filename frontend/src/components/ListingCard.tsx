"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ListingDTO } from "@festora/types";
import { ImageCarousel } from "@/components/ImageCarousel";
import { SellerAvatar } from "@/components/SellerAvatar";
import { WishlistButton } from "@/components/WishlistButton";

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
      className="block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative w-full overflow-hidden bg-gray-100">
        <ImageCarousel images={listing.images} alt={listing.title} />
        <div className="absolute left-2 top-2 z-10">
          <WishlistButton listingId={listing.id} />
        </div>
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
            <SellerAvatar name={listing.storeName} />
            <span className="truncate hover:underline">{listing.storeName}</span>
          </span>
        ) : (
          <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-gray-500">
            <SellerAvatar name={listing.storeName} />
            {listing.storeName}
          </p>
        )}
        {listing.city && <p className="text-xs text-gray-400">{listing.city}</p>}
      </div>
    </Link>
  );
}
