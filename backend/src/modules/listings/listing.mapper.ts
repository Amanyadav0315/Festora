import type { ListingDTO } from "@festora/types";

export function toListingDTO(listing: any): ListingDTO {
  const store = listing.storeId;
  return {
    id: listing._id.toString(),
    storeId: (store?._id ?? listing.storeId).toString(),
    storeName: store?.name ?? "",
    ownerId: store?.ownerId ? store.ownerId.toString() : undefined,
    categorySlugs: listing.categorySlugs,
    subcategorySlug: listing.subcategorySlug,
    condition: listing.condition,
    purpose: listing.purpose,
    title: listing.title,
    keywords: listing.keywords,
    description: listing.description,
    descriptionHi: listing.descriptionHi,
    price: listing.price,
    priceUnit: listing.priceUnit,
    images: listing.images ?? [],
    city: listing.city,
    locationUrl: listing.locationUrl,
    isActive: listing.isActive,
    createdAt: listing.createdAt.toISOString(),
  };
}
