import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { ListingDTO } from "@festora/types";
import { serverFetch } from "@/lib/server-api";
import { ImageCarousel } from "@/components/ImageCarousel";

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
      <div className="overflow-hidden rounded-lg">
        <ImageCarousel images={listing.images} alt={listing.title} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
          {listing.condition === "new" ? "New" : "Used"}
        </span>
        <span className="rounded-full bg-orange-50 px-2.5 py-1 font-medium text-orange-600">
          {listing.purpose === "rent" ? "For rent" : "For sale"}
        </span>
      </div>
      <h1 className="mt-2 text-xl font-bold sm:text-2xl">{listing.title}</h1>
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
      <p className="mt-4 text-sm text-gray-500">
        Sold by{" "}
        {listing.ownerId ? (
          <Link href={`/u/${listing.ownerId}`} className="font-medium text-orange-600 hover:underline">
            {listing.storeName}
          </Link>
        ) : (
          listing.storeName
        )}
        {listing.city ? ` · ${listing.city}` : ""}
      </p>
    </main>
  );
}
