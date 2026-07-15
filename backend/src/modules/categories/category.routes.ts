import { Router } from "express";
import { categoryController } from "./category.controller";
import { asyncHandler } from "../../middleware/asyncHandler";

export const categoryRouter = Router();

categoryRouter.get("/", asyncHandler(categoryController.list));
