import { Router } from "express";
import { subcategoryController } from "./subcategory.controller";
import { asyncHandler } from "../../middleware/asyncHandler";

export const subcategoryRouter = Router();

subcategoryRouter.get("/", asyncHandler(subcategoryController.list));
