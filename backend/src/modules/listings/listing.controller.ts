import type { Request, Response } from "express";
import { MAX_LISTING_IMAGES, MIN_LISTING_IMAGES } from "@eventsaman/types";
import { ListingModel } from "./listing.model";
import { StoreModel } from "../stores/store.model";
import { CategoryModel } from "../categories/category.model";
import { UserModel } from "../users/user.model";
import { createListingSchema, updateListingSchema, listListingsQuerySchema } from "./listing.schemas";
import { toListingDTO } from "./listing.mapper";
import { listingImageUrl } from "../../middleware/upload";
import { ApiError } from "../../middleware/errorHandler";

const MAX_LISTINGS_PER_DAY = 20;

async function getOrCreateStore(userId: string, categorySlugs: string[]) {
  const existing = await StoreModel.findOne({ ownerId: userId });
  if (existing) return existing;

  const user = await UserModel.findById(userId);
  const name = user ? `${user.name}'s Store` : "My Store";
  return StoreModel.create({ ownerId: userId, name, categories: categorySlugs });
}

async function loadOwnedListing(listingId: string, userId: string) {
  const listing = await ListingModel.findById(listingId).populate("storeId", "name ownerId");
  if (!listing) throw new ApiError(404, "Listing not found");
  const store = listing.storeId as unknown as { ownerId: { toString(): string } };
  if (store.ownerId.toString() !== userId) throw new ApiError(403, "You don't own this listing");
  return listing;
}

export const listingController = {
  async list(req: Request, res: Response) {
    const query = listListingsQuerySchema.parse(req.query);
    const filter: Record<string, unknown> = {};

    if (query.categorySlug) filter.categorySlugs = query.categorySlug;
    if (query.subcategorySlug) filter.subcategorySlug = query.subcategorySlug;
    if (query.condition) filter.condition = query.condition;
    if (query.purpose) filter.purpose = query.purpose;
    if (query.cities) {
      const cityList = query.cities
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      if (cityList.length > 0) {
        filter.city = {
          $in: cityList.map((c) => new RegExp(`^${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")),
        };
      }
    } else if (query.city) {
      filter.city = new RegExp(`^${query.city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    }
    if (query.q) filter.$text = { $search: query.q };
    if (query.storeId) filter.storeId = query.storeId;

    let allowInactive = false;
    if (query.includeInactive && query.storeId && req.user) {
      const store = await StoreModel.findById(query.storeId);
      allowInactive = Boolean(store && store.ownerId.toString() === req.user.sub);
    }
    if (!allowInactive) filter.isActive = true;

    const listings = await ListingModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(query.limit)
      .populate({ path: "storeId", select: "name ownerId", populate: { path: "ownerId", select: "avatarUrl" } });

    res.json({ listings: listings.map(toListingDTO) });
  },

  async create(req: Request, res: Response) {
    const input = createListingSchema.parse(req.body);

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length < MIN_LISTING_IMAGES || files.length > MAX_LISTING_IMAGES) {
      throw new ApiError(400, `Upload between ${MIN_LISTING_IMAGES} and ${MAX_LISTING_IMAGES} photos`);
    }

    const existingCategories = await CategoryModel.countDocuments({ slug: { $in: input.categorySlugs } });
    if (existingCategories !== input.categorySlugs.length) {
      throw new ApiError(400, "One or more selected categories no longer exist");
    }

    const store = await getOrCreateStore(req.user!.sub, input.categorySlugs);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const postedToday = await ListingModel.countDocuments({ storeId: store._id, createdAt: { $gte: todayStart } });
    if (postedToday >= MAX_LISTINGS_PER_DAY) {
      throw new ApiError(429, `You've reached the daily limit of ${MAX_LISTINGS_PER_DAY} listings. Try again tomorrow.`);
    }

    const images = files.map((f) => listingImageUrl(f.filename));

    const listing = await ListingModel.create({ ...input, images, storeId: store._id });
    const populated = await listing.populate({ path: "storeId", select: "name ownerId", populate: { path: "ownerId", select: "avatarUrl" } });
    res.status(201).json({ listing: toListingDTO(populated) });
  },

  async getOne(req: Request, res: Response) {
    const listing = await ListingModel.findById(req.params.id).populate({ path: "storeId", select: "name ownerId", populate: { path: "ownerId", select: "avatarUrl" } });
    if (!listing) throw new ApiError(404, "Listing not found");
    res.json({ listing: toListingDTO(listing) });
  },

  async update(req: Request, res: Response) {
    const listing = await loadOwnedListing(req.params.id, req.user!.sub);
    const input = updateListingSchema.parse(req.body);

    if (input.categorySlugs) {
      const existingCategories = await CategoryModel.countDocuments({ slug: { $in: input.categorySlugs } });
      if (existingCategories !== input.categorySlugs.length) {
        throw new ApiError(400, "One or more selected categories no longer exist");
      }
    }

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const newImageUrls = files.map((f) => listingImageUrl(f.filename));
    const keptImages = input.existingImages ?? listing.images;
    const images = [...keptImages, ...newImageUrls];
    if (images.length < MIN_LISTING_IMAGES || images.length > MAX_LISTING_IMAGES) {
      throw new ApiError(400, `Keep between ${MIN_LISTING_IMAGES} and ${MAX_LISTING_IMAGES} photos`);
    }

    const { existingImages: _existingImages, ...rest } = input;
    Object.assign(listing, rest, { images });
    await listing.save();
    const populated = await listing.populate({ path: "storeId", select: "name ownerId", populate: { path: "ownerId", select: "avatarUrl" } });
    res.json({ listing: toListingDTO(populated) });
  },

  async remove(req: Request, res: Response) {
    const listing = await loadOwnedListing(req.params.id, req.user!.sub);
    await listing.deleteOne();
    res.status(204).send();
  },
};
