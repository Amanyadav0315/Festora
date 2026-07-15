import type { Request, Response } from "express";
import { ListingModel } from "./listing.model";
import { StoreModel } from "../stores/store.model";
import { createListingSchema, listListingsQuerySchema } from "./listing.schemas";
import { toListingDTO } from "./listing.mapper";
import { ApiError } from "../../middleware/errorHandler";

export const listingController = {
  async list(req: Request, res: Response) {
    const query = listListingsQuerySchema.parse(req.query);
    const filter: Record<string, unknown> = { isActive: true };

    if (query.categorySlug) filter.categorySlug = query.categorySlug;
    if (query.subcategorySlug) filter.subcategorySlug = query.subcategorySlug;
    if (query.city) filter.city = new RegExp(`^${query.city}$`, "i");
    if (query.q) filter.$text = { $search: query.q };

    const listings = await ListingModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(query.limit)
      .populate("storeId", "name");

    res.json({ listings: listings.map(toListingDTO) });
  },

  async create(req: Request, res: Response) {
    const input = createListingSchema.parse(req.body);
    const store = await StoreModel.findOne({ ownerId: req.user!.sub });
    if (!store) throw new ApiError(404, "Create a store before adding listings");

    const listing = await ListingModel.create({ ...input, storeId: store._id });
    const populated = await listing.populate("storeId", "name");
    res.status(201).json({ listing: toListingDTO(populated) });
  },
};
