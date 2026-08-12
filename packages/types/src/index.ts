export type UserRole = "user" | "admin";

export const MAX_MAIN_CATEGORIES = 8;

export type CategorySlug = string;

export interface UserDTO {
  id: string;
  name: string;
  phone: string;
  email?: string;
  about?: string;
  avatarUrl?: string;
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
  isMain: boolean;
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

export const MIN_LISTING_KEYWORDS = 3;
export const MAX_LISTING_KEYWORDS = 10;
export const MAX_LISTING_CATEGORIES = 3;
export const MAX_LISTING_DESCRIPTION_LENGTH = 200;
export const MIN_LISTING_IMAGES = 1;
export const MAX_LISTING_IMAGES = 6;

export type ListingCondition = "new" | "old";
export type ListingPurpose = "sell" | "rent";

export interface ListingDTO {
  id: string;
  storeId: string;
  storeName: string;
  ownerId?: string;
  categorySlugs: CategorySlug[];
  subcategorySlug?: string;
  condition: ListingCondition;
  purpose: ListingPurpose;
  title: string;
  keywords: string[];
  description: string;
  descriptionHi?: string;
  price: number;
  priceUnit?: string;
  images: string[];
  city?: string;
  locationUrl?: string;
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
  about?: string;
  avatarUrl?: string;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing: boolean;
  isBlocked: boolean;
  isSelf: boolean;
  store?: StoreDTO;
}

export interface MessageReplyPreviewDTO {
  id: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  replyTo?: MessageReplyPreviewDTO;
  edited: boolean;
  deletedForEveryone: boolean;
  isMine: boolean;
  createdAt: string;
}

export interface ConversationDTO {
  id: string;
  otherUser: { id: string; name: string };
  lastMessageText?: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatMediaItemDTO {
  id: string;
  imageUrl: string;
  senderId: string;
  createdAt: string;
}

export interface ReportDTO {
  id: string;
  reporter: { id: string; name: string };
  reported: { id: string; name: string };
  reason: string;
  screenshots: string[];
  status: "pending" | "reviewed";
  createdAt: string;
}

export interface IssueReportDTO {
  id: string;
  reporter: { id: string; name: string };
  message: string;
  screenshots: string[];
  status: "pending" | "reviewed";
  createdAt: string;
}

export interface AuthTokensDTO {
  accessToken: string;
  refreshToken: string;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string>;
}
