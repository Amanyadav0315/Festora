import type { Request, Response } from "express";
import { WishlistModel } from "./wishlist.model";
import { ListingModel } from "../listings/listing.model";
import { toListingDTO } from "../listings/listing.mapper";
import { ApiError } from "../../middleware/errorHandler";

export const wishlistController = {
  async add(req: Request, res: Response) {
    const listingId = req.params.listingId;
    const listing = await ListingModel.findById(listingId);
    if (!listing) throw new ApiError(404, "Listing not found");

    await WishlistModel.updateOne(
      { userId: req.user!.sub, listingId },
      { $setOnInsert: { userId: req.user!.sub, listingId } },
      { upsert: true }
    );
    res.status(201).json({ wishlisted: true });
  },

  async remove(req: Request, res: Response) {
    await WishlistModel.deleteOne({ userId: req.user!.sub, listingId: req.params.listingId });
    res.json({ wishlisted: false });
  },

  async list(req: Request, res: Response) {
    const entries = await WishlistModel.find({ userId: req.user!.sub })
      .sort({ createdAt: -1 })
      .populate({
        path: "listingId",
        populate: { path: "storeId", select: "name ownerId" },
      });

    const listings = entries
      .filter((e) => e.listingId)
      .map((e) => toListingDTO(e.listingId));
    res.json({ listings });
  },

  async mine(req: Request, res: Response) {
    const entries = await WishlistModel.find({ userId: req.user!.sub }, "listingId");
    res.json({ listingIds: entries.map((e) => e.listingId.toString()) });
  },
};
