import type { ListingDTO } from "@festora/types";
import { serverFetch } from "@/lib/server-api";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { listings } = await serverFetch<{ listings: ListingDTO[] }>(`/listings?limit=50`);
  const listing = listings.find((l) => l.id === id);

  if (!listing) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-gray-500">Listing not found.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={listing.images[0] ?? "/placeholder-listing.svg"}
        alt={listing.title}
        className="aspect-[4/3] w-full rounded-lg object-cover"
      />
      <h1 className="mt-4 text-xl font-bold sm:text-2xl">{listing.title}</h1>
      <p className="mt-1 text-lg font-semibold text-orange-600 sm:text-xl">
        ₹{listing.price.toLocaleString("en-IN")}
        {listing.priceUnit ? ` / ${listing.priceUnit.replace(/^per /, "")}` : ""}
      </p>
      {listing.description && <p className="mt-4 text-sm text-gray-700 sm:text-base">{listing.description}</p>}
      <p className="mt-4 text-sm text-gray-500">
        Sold by {listing.storeName}
        {listing.city ? ` · ${listing.city}` : ""}
      </p>
    </main>
  );
}
