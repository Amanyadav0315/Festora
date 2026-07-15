import type { Request, Response } from "express";
import { authService } from "./auth.service";
import { signupSchema, loginSchema } from "./auth.schemas";
import { ApiError } from "../../middleware/errorHandler";

const REFRESH_COOKIE = "festora_refresh_token";
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: false,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/api/auth",
};

export const authController = {
  async signup(req: Request, res: Response) {
    const input = signupSchema.parse(req.body);
    const result = await authService.signup(input);
    res.cookie(REFRESH_COOKIE, result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(201).json({ user: result.user, accessToken: result.accessToken });
  },

  async login(req: Request, res: Response) {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    res.cookie(REFRESH_COOKIE, result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(200).json({ user: result.user, accessToken: result.accessToken });
  },

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) throw new ApiError(401, "No refresh token provided");
    const result = await authService.refresh(refreshToken);
    res.cookie(REFRESH_COOKIE, result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(200).json({ user: result.user, accessToken: result.accessToken });
  },

  async logout(req: Request, res: Response) {
    res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
    res.status(204).send();
  },
};
