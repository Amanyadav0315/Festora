import { cookies } from "next/headers";
import type { ListingDTO, SubcategoryDTO } from "@eventsaman/types";
import { getTranslations } from "next-intl/server";
import { serverFetch } from "@/lib/server-api";
import { getNearbyCities } from "@/lib/cities";
import { CategoryGrid } from "@/components/CategoryGrid";
import { ListingCard } from "@/components/ListingCard";

const LOCATION_COOKIE = "eventsaman_location";

export default async function HomePage() {
  const t = await getTranslations("home");
  const cookieStore = await cookies();
  const location = cookieStore.get(LOCATION_COOKIE)?.value;

  // Same "nearby = same state" expansion /browse uses, so the active location (set via the
  // navbar's LocationPicker) prioritizes relevant listings here too, not only on search results.
  // Home only shows "for sale" listings — rentals belong on the dedicated Rent page (/browse?purpose=rent).
  const listingsQuery = new URLSearchParams({ limit: "12", purpose: "sell" });
  if (location && location !== "All India") {
    listingsQuery.set("cities", getNearbyCities(location).join(","));
  }

  const [{ subcategories: featured }, { subcategories: all }, { listings }] = await Promise.all([
    serverFetch<{ subcategories: SubcategoryDTO[] }>("/subcategories?featured=true"),
    serverFetch<{ subcategories: SubcategoryDTO[] }>("/subcategories"),
    serverFetch<{ listings: ListingDTO[] }>(`/listings?${listingsQuery.toString()}`),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
      <CategoryGrid featured={featured} all={all} />

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">{t("recommendations")}</h2>
          {location && location !== "All India" && (
            <span className="text-xs text-gray-500">Near {location}</span>
          )}
        </div>
        {listings.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">{t("empty")}</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
