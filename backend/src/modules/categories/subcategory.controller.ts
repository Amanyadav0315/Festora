import type { Request, Response } from "express";
import { SubcategoryModel } from "./subcategory.model";

function toDTO(s: any) {
  return {
    id: s._id.toString(),
    name: s.name,
    slug: s.slug,
    categorySlug: s.categorySlug,
    description: s.description,
    icon: s.icon,
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
};
