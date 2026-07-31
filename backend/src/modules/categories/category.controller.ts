import type { Request, Response } from "express";
import { CategoryModel } from "./category.model";
import { updateCategorySchema } from "./category.schemas";
import { categoryImageUrl } from "../../middleware/upload";
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
  };
}

export const categoryController = {
  async list(req: Request, res: Response) {
    const categories = await CategoryModel.find().sort({ name: 1 });
    res.json({ categories: categories.map(toDTO) });
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

    await category.save();
    res.json({ category: toDTO(category) });
  },
};