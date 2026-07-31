export type UserRole = "user" | "admin";

export const CATEGORY_SLUGS = [
  "tent-house-mandap",
  "dj-sound",
  "photography-videography",
  "banquet-halls",
  "catering",
  "resorts-farmhouses",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export interface UserDTO {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  createdAt: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  nameHi?: string;
  slug: CategorySlug;
  description?: string;
  descriptionHi?: string;
  icon?: string;
  imageUrl?: string;
}

export interface SubcategoryDTO {
  id: string;
  name: string;
  nameHi?: string;
  slug: string;
  categorySlug: CategorySlug;
  description?: string;
  icon?: string;
  imageUrl?: string;
  featured: boolean;
}

export interface StoreDTO {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  categories: CategorySlug[];
  city?: string;
  createdAt: string;
}

export type ListingType = "product" | "rental" | "venue" | "service";

export interface ListingDTO {
  id: string;
  storeId: string;
  storeName: string;
  ownerId?: string;
  categorySlug: CategorySlug;
  subcategorySlug?: string;
  type: ListingType;
  title: string;
  description?: string;
  price: number;
  priceUnit?: string;
  images: string[];
  city?: string;
  isActive: boolean;
  createdAt: string;
}

export type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled";

export interface BookingDTO {
  id: string;
  listingId: string;
  buyerId: string;
  vendorId: string;
  status: BookingStatus;
  eventDate?: string;
  notes?: string;
  createdAt: string;
}

export interface FollowUserSummaryDTO {
  id: string;
  name: string;
}

export interface PublicUserProfileDTO {
  id: string;
  name: string;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing: boolean;
  isBlocked: boolean;
  isSelf: boolean;
  store?: StoreDTO;
}

export interface AuthTokensDTO {
  accessToken: string;
  refreshToken: string;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string>;
}
