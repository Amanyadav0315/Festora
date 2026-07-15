import type { ListingDTO } from "@festora/types";

export function toListingDTO(listing: any): ListingDTO {
  const store = listing.storeId;
  return {
    id: listing._id.toString(),
    storeId: (store?._id ?? listing.storeId).toString(),
    storeName: store?.name ?? "",
    categorySlug: listing.categorySlug,
    subcategorySlug: listing.subcategorySlug,
    type: listing.type,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    priceUnit: listing.priceUnit,
    images: listing.images ?? [],
    city: listing.city,
    isActive: listing.isActive,
    createdAt: listing.createdAt.toISOString(),
  };
}
