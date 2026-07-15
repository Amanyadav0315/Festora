import type { ListingDTO } from "@festora/types";
import { serverFetch } from "@/lib/server-api";
import { ListingCard } from "@/components/ListingCard";

interface BrowsePageProps {
  searchParams: Promise<{ q?: string; city?: string; subcategory?: string; category?: string }>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.city) query.set("city", params.city);
  if (params.subcategory) query.set("subcategorySlug", params.subcategory);
  if (params.category) query.set("categorySlug", params.category);
  query.set("limit", "40");

  const { listings } = await serverFetch<{ listings: ListingDTO[] }>(`/listings?${query.toString()}`);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-xl font-bold">
        {params.q ? `Results for "${params.q}"` : "Browse listings"}
      </h1>

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
