import type { ListingDTO, SubcategoryDTO } from "@eventsaman/types";
import { getTranslations } from "next-intl/server";
import { serverFetch } from "@/lib/server-api";
import { CategoryGrid } from "@/components/CategoryGrid";
import { ListingCard } from "@/components/ListingCard";

export default async function HomePage() {
  const t = await getTranslations("home");
  const [{ subcategories: featured }, { subcategories: all }, { listings }] = await Promise.all([
    serverFetch<{ subcategories: SubcategoryDTO[] }>("/subcategories?featured=true"),
    serverFetch<{ subcategories: SubcategoryDTO[] }>("/subcategories"),
    serverFetch<{ listings: ListingDTO[] }>("/listings?limit=12"),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
      <CategoryGrid featured={featured} all={all} />

      <section className="mt-10">
        <h2 className="text-lg font-semibold">{t("recommendations")}</h2>
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
