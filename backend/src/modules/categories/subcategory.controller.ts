import type { Request, Response } from "express";
import { SubcategoryModel } from "./subcategory.model";
import { createSubcategorySchema, updateSubcategorySchema } from "./subcategory.schemas";
import { categoryImageUrl } from "../../middleware/upload";
import { slugify } from "../../lib/slugify";
import { ApiError } from "../../middleware/errorHandler";

function toDTO(s: any) {
  return {
    id: s._id.toString(),
    name: s.name,
    nameHi: s.nameHi,
    slug: s.slug,
    categorySlug: s.categorySlug,
    description: s.description,
    icon: s.icon,
    imageUrl: s.imageUrl,
    featured: s.featured,
  };
}

export const subcategoryController = {
  async list(req: Request, res: Response) {
    const filter: Record<string, unknown> = {};
    if (req.query.featured === "true") filter.featured = true;
    if (req.query.categorySlug) filter.categorySlug = req.query.categorySlug;

    const subcategories = await SubcategoryModel.find(filter).sort({ name: 1 });
    res.json({ subcategories: subcategories.map(toDTO) });
  },

  async create(req: Request, res: Response) {
    const input = createSubcategorySchema.parse(req.body);
    const slug = input.slug ? slugify(input.slug) : slugify(input.name);
    if (!slug) throw new ApiError(400, "Could not derive a slug from the name");

    const existing = await SubcategoryModel.findOne({ slug });
    if (existing) throw new ApiError(409, `A category with slug "${slug}" already exists`);

    const imageUrl = req.file ? categoryImageUrl(req.file.filename) : undefined;

    const subcategory = await SubcategoryModel.create({
      name: input.name,
      nameHi: input.nameHi,
      slug,
      categorySlug: input.categorySlug,
      description: input.description,
      icon: input.icon,
      imageUrl,
      featured: input.featured ?? false,
    });

    res.status(201).json({ subcategory: toDTO(subcategory) });
  },

  async update(req: Request, res: Response) {
    const input = updateSubcategorySchema.parse(req.body);
    const subcategory = await SubcategoryModel.findById(req.params.id);
    if (!subcategory) throw new ApiError(404, "Category not found");

    if (input.name !== undefined) subcategory.name = input.name;
    if (input.nameHi !== undefined) subcategory.nameHi = input.nameHi;
    if (input.categorySlug !== undefined) subcategory.categorySlug = input.categorySlug;
    if (input.description !== undefined) subcategory.description = input.description;
    if (input.icon !== undefined) subcategory.icon = input.icon;
    if (input.featured !== undefined) subcategory.featured = input.featured;
    if (req.file) subcategory.imageUrl = categoryImageUrl(req.file.filename);

    await subcategory.save();
    res.json({ subcategory: toDTO(subcategory) });
  },

  async remove(req: Request, res: Response) {
    const subcategory = await SubcategoryModel.findByIdAndDelete(req.params.id);
    if (!subcategory) throw new ApiError(404, "Category not found");
    res.status(204).send();
  },
};