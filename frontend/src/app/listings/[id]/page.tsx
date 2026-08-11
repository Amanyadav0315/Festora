import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { ListingDTO } from "@eventsaman/types";
import { serverFetch } from "@/lib/server-api";
import { ImageCarousel } from "@/components/ImageCarousel";
import { SellerAvatar } from "@/components/SellerAvatar";
import { WishlistButton } from "@/components/WishlistButton";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const { listings } = await serverFetch<{ listings: ListingDTO[] }>(`/listings?limit=50`);
  const listing = listings.find((l) => l.id === id);

  if (!listing) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-gray-500">Listing not found.</p>
      </main>
    );
  }

  const description = locale === "hi" && listing.descriptionHi ? listing.descriptionHi : listing.description;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <ImageCarousel
        images={listing.images}
        alt={listing.title}
        aspect="aspect-[4/3] max-h-[420px]"
        showThumbnails
      />
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
          {listing.condition === "new" ? "New" : "Used"}
        </span>
        <span className="rounded-full bg-orange-50 px-2.5 py-1 font-medium text-orange-600">
          {listing.purpose === "rent" ? "For rent" : "For sale"}
        </span>
      </div>
      <div className="mt-2 flex items-start justify-between gap-3">
        <h1 className="text-xl font-bold sm:text-2xl">{listing.title}</h1>
        <WishlistButton
          listingId={listing.id}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-rose-600"
        />
      </div>
      <p className="mt-1 text-lg font-semibold text-orange-600 sm:text-xl">
        ₹{listing.price.toLocaleString("en-IN")}
        {listing.priceUnit ? ` / ${listing.priceUnit.replace(/^per /, "")}` : ""}
      </p>
      {description && <p className="mt-4 text-sm text-gray-700 sm:text-base">{description}</p>}
      {listing.keywords.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {listing.keywords.map((k) => (
            <span key={k} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
              #{k}
            </span>
          ))}
        </div>
      )}
      {listing.locationUrl && (
        <a
          href={listing.locationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
        >
          <PinIcon />
          View location on map
          <span className="ml-auto text-gray-400">↗</span>
        </a>
      )}

      {listing.ownerId ? (
        <Link
          href={`/u/${listing.ownerId}`}
          className="mt-4 flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-3 transition hover:border-orange-300 hover:bg-orange-50"
        >
          <SellerAvatar name={listing.storeName} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{listing.storeName}</p>
            <p className="text-xs text-gray-500">{listing.city ? listing.city : "View seller profile"}</p>
          </div>
          <span className="shrink-0 text-sm font-medium text-orange-600">View profile ›</span>
        </Link>
      ) : (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-3">
          <SellerAvatar name={listing.storeName} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{listing.storeName}</p>
            {listing.city && <p className="text-xs text-gray-500">{listing.city}</p>}
          </div>
        </div>
      )}
    </main>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s-7-5.686-7-11a7 7 0 1 1 14 0c0 5.314-7 11-7 11z"
      />
      <circle cx="12" cy="10" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
