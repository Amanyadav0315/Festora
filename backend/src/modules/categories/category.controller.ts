import type { Request, Response } from "express";
import { CategoryModel } from "./category.model";

export const categoryController = {
  async list(req: Request, res: Response) {
    const categories = await CategoryModel.find().sort({ name: 1 });
    res.json({
      categories: categories.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        slug: c.slug,
        description: c.description,
        icon: c.icon,
      })),
    });
  },
};
