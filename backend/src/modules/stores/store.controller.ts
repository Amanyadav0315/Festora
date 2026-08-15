import type { Request, Response } from "express";
import { StoreModel } from "./store.model";
import { createStoreSchema, updateAvailabilitySchema } from "./store.schemas";
import { ApiError } from "../../middleware/errorHandler";

function toStoreDTO(store: any) {
  return {
    id: store._id.toString(),
    ownerId: store.ownerId.toString(),
    name: store.name,
    description: store.description,
    categories: store.categories,
    city: store.city,
    unavailableDates: store.unavailableDates ?? [],
    createdAt: store.createdAt.toISOString(),
  };
}

export const storeController = {
  async create(req: Request, res: Response) {
    const input = createStoreSchema.parse(req.body);
    const existing = await StoreModel.findOne({ ownerId: req.user!.sub });
    if (existing) throw new ApiError(409, "You already have a store");

    const store = await StoreModel.create({ ...input, ownerId: req.user!.sub });
    res.status(201).json({ store: toStoreDTO(store) });
  },

  async myStore(req: Request, res: Response) {
    const store = await StoreModel.findOne({ ownerId: req.user!.sub });
    if (!store) throw new ApiError(404, "Store not found");
    res.json({ store: toStoreDTO(store) });
  },

  async getByOwner(req: Request, res: Response) {
    const store = await StoreModel.findOne({ ownerId: req.params.userId });
    if (!store) throw new ApiError(404, "Store not found");
    res.json({ store: toStoreDTO(store) });
  },

  async getById(req: Request, res: Response) {
    const store = await StoreModel.findById(req.params.id);
    if (!store) throw new ApiError(404, "Store not found");
    res.json({ store: toStoreDTO(store) });
  },

  // PATCH /stores/me/availability — the owner sets the full list of dates they're unavailable
  // on. Purely informational for buyers; not a booking system.
  async updateAvailability(req: Request, res: Response) {
    const input = updateAvailabilitySchema.parse(req.body);
    const store = await StoreModel.findOne({ ownerId: req.user!.sub });
    if (!store) throw new ApiError(404, "Store not found");
    (store as any).unavailableDates = input.unavailableDates;
    await store.save();
    res.json({ store: toStoreDTO(store) });
  },
};
