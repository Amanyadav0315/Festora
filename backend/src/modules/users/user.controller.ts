import type { Request, Response } from "express";
import { userRepository } from "./user.repository";
import { toUserDTO } from "./user.mapper";
import { ApiError } from "../../middleware/errorHandler";

export const userController = {
  async me(req: Request, res: Response) {
    const user = await userRepository.findById(req.user!.sub);
    if (!user) throw new ApiError(404, "User not found");
    res.json({ user: toUserDTO(user) });
  },
};
