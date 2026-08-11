import type { Request, Response } from "express";
import { MAX_MAIN_CATEGORIES } from "@eventsaman/types";
import { CategoryModel } from "./category.model";
import { SubcategoryModel } from "./subcategory.model";
import { StoreModel } from "../stores/store.model";
import { ListingModel } from "../listings/listing.model";
import { createCategorySchema, updateCategorySchema } from "./category.schemas";
import { categoryImageUrl } from "../../middleware/upload";
import { slugify } from "../../lib/slugify";
import { ApiError } from "../../middleware/errorHandler";

function toDTO(c: any) {
  return {
    id: c._id.toString(),
    name: c.name,
    nameHi: c.nameHi,
    slug: c.slug,
    description: c.description,
    descriptionHi: c.descriptionHi,
    icon: c.icon,
    imageUrl: c.imageUrl,
    isMain: c.isMain,
  };
}

async function assertMainCategorySlotAvailable() {
  const mainCount = await CategoryModel.countDocuments({ isMain: true });
  if (mainCount >= MAX_MAIN_CATEGORIES) {
    throw new ApiError(
      409,
      `Maximum of ${MAX_MAIN_CATEGORIES} main categories reached. Remove one before adding another.`
    );
  }
}

export const categoryController = {
  async list(req: Request, res: Response) {
    const categories = await CategoryModel.find().sort({ name: 1 });
    res.json({ categories: categories.map(toDTO) });
  },

  async create(req: Request, res: Response) {
    const input = createCategorySchema.parse(req.body);
    const slug = input.slug ? slugify(input.slug) : slugify(input.name);
    if (!slug) throw new ApiError(400, "Could not derive a slug from the name");

    const existing = await CategoryModel.findOne({ slug });
    if (existing) throw new ApiError(409, `A category with slug "${slug}" already exists`);

    if (input.isMain) await assertMainCategorySlotAvailable();

    const imageUrl = req.file ? categoryImageUrl(req.file.filename) : undefined;

    const category = await CategoryModel.create({
      name: input.name,
      nameHi: input.nameHi,
      slug,
      description: input.description,
      descriptionHi: input.descriptionHi,
      icon: input.icon,
      imageUrl,
      isMain: input.isMain ?? false,
    });

    res.status(201).json({ category: toDTO(category) });
  },

  async update(req: Request, res: Response) {
    const input = updateCategorySchema.parse(req.body);
    const category = await CategoryModel.findById(req.params.id);
    if (!category) throw new ApiError(404, "Category not found");

    if (input.name !== undefined) category.name = input.name;
    if (input.nameHi !== undefined) category.nameHi = input.nameHi;
    if (input.description !== undefined) category.description = input.description;
    if (input.descriptionHi !== undefined) category.descriptionHi = input.descriptionHi;
    if (input.icon !== undefined) category.icon = input.icon;
    if (req.file) category.imageUrl = categoryImageUrl(req.file.filename);

    if (input.isMain !== undefined && input.isMain !== category.isMain) {
      if (input.isMain) await assertMainCategorySlotAvailable();
      category.isMain = input.isMain;
    }

    await category.save();
    res.json({ category: toDTO(category) });
  },

  async remove(req: Request, res: Response) {
    const category = await CategoryModel.findById(req.params.id);
    if (!category) throw new ApiError(404, "Category not found");

    const [subcategoryCount, storeCount, listingCount] = await Promise.all([
      SubcategoryModel.countDocuments({ categorySlug: category.slug }),
      StoreModel.countDocuments({ categories: category.slug }),
      ListingModel.countDocuments({ categorySlug: category.slug }),
    ]);
    if (subcategoryCount > 0 || storeCount > 0 || listingCount > 0) {
      throw new ApiError(409, "Cannot delete a category that still has tiles, stores, or listings using it");
    }

    await category.deleteOne();
    res.status(204).send();
  },
};
