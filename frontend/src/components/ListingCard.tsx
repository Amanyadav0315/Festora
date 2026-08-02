import Link from "next/link";
import type { ListingDTO } from "@festora/types";
import { ImageCarousel } from "@/components/ImageCarousel";

function formatPrice(price: number, priceUnit?: string) {
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
  return priceUnit ? `${formatted} / ${priceUnit.replace(/^per /, "")}` : formatted;
}

export function ListingCard({ listing }: { listing: ListingDTO }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="w-full overflow-hidden bg-gray-100">
        <ImageCarousel images={listing.images} alt={listing.title} />
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
              window.location.href = `/u/${listing.ownerId}`;
            }}
            className="mt-1 block truncate text-xs text-gray-500 hover:text-orange-600 hover:underline"
          >
            {listing.storeName}
          </span>
        ) : (
          <p className="mt-1 truncate text-xs text-gray-500">{listing.storeName}</p>
        )}
        {listing.city && <p className="text-xs text-gray-400">{listing.city}</p>}
      </div>
    </Link>
  );
}
