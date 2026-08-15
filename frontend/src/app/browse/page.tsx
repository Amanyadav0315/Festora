import type { ListingDTO } from "@eventsaman/types";
import { serverFetch } from "@/lib/server-api";
import { ListingCard } from "@/components/ListingCard";
import { BrowseFilters } from "@/components/BrowseFilters";
import { getNearbyCities } from "@/lib/cities";

interface BrowsePageProps {
  searchParams: Promise<{
    q?: string;
    city?: string;
    subcategory?: string;
    category?: string;
    purpose?: string;
    condition?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.city && params.city !== "All India") {
    query.set("cities", getNearbyCities(params.city).join(","));
  }
  if (params.subcategory) query.set("subcategorySlug", params.subcategory);
  if (params.category) query.set("categorySlug", params.category);
  if (params.purpose) query.set("purpose", params.purpose);
  if (params.condition) query.set("condition", params.condition);
  if (params.minPrice) query.set("minPrice", params.minPrice);
  if (params.maxPrice) query.set("maxPrice", params.maxPrice);
  if (params.sort) query.set("sort", params.sort);
  query.set("limit", "40");

  const { listings } = await serverFetch<{ listings: ListingDTO[] }>(`/listings?${query.toString()}`);

  const title = params.q
    ? `Results for "${params.q}"`
    : params.purpose === "rent"
      ? "Rentals"
      : params.condition === "new"
        ? "New items"
        : params.condition === "old"
          ? "Used items"
          : "Browse listings";

  return (
    <main className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
      <h1 className="text-lg font-bold sm:text-xl">{title}</h1>
      {params.city && params.city !== "All India" && (
        <p className="mt-1 text-xs text-gray-500">Showing results in {params.city} and nearby areas</p>
      )}

      <BrowseFilters />

      {listings.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">No listings match your search yet.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </main>
  );
}
