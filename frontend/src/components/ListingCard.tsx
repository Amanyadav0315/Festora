import Link from "next/link";
import type { ListingDTO } from "@festora/types";

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
      <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={listing.images[0] ?? "/placeholder-listing.svg"}
          alt={listing.title}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-2 sm:p-3">
        <p className="text-sm font-semibold text-gray-900 sm:text-base">{formatPrice(listing.price, listing.priceUnit)}</p>
        <p className="mt-1 truncate text-xs text-gray-700 sm:text-sm">{listing.title}</p>
        <p className="mt-1 truncate text-xs text-gray-500">{listing.storeName}</p>
        {listing.city && <p className="text-xs text-gray-400">{listing.city}</p>}
      </div>
    </Link>
  );
}
