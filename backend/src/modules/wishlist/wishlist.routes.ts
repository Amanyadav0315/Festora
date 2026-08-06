import { Router } from "express";
import { wishlistController } from "./wishlist.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";

export const wishlistRouter = Router();

wishlistRouter.use(requireAuth);
wishlistRouter.get("/", asyncHandler(wishlistController.list));
wishlistRouter.get("/mine", asyncHandler(wishlistController.mine));
wishlistRouter.post("/:listingId", asyncHandler(wishlistController.add));
wishlistRouter.delete("/:listingId", asyncHandler(wishlistController.remove));
