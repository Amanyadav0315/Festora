import type { Request, Response } from "express";
import { authService } from "./auth.service";
import { signupSchema, loginSchema } from "./auth.schemas";
import { ApiError } from "../../middleware/errorHandler";

const REFRESH_COOKIE = "eventsaman_refresh_token";
const ADMIN_REFRESH_COOKIE_MAX_AGE = 24 * 60 * 60 * 1000;
const USER_REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function refreshCookieOptions(role: string) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: false,
    maxAge: role === "admin" ? ADMIN_REFRESH_COOKIE_MAX_AGE : USER_REFRESH_COOKIE_MAX_AGE,
    path: "/api/auth",
  };
}

export const authController = {
  async signup(req: Request, res: Response) {
    const input = signupSchema.parse(req.body);
    const result = await authService.signup(input);
    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions(result.user.role));
    res.status(201).json({ user: result.user, accessToken: result.accessToken });
  },

  async login(req: Request, res: Response) {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions(result.user.role));
    res.status(200).json({ user: result.user, accessToken: result.accessToken });
  },

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) throw new ApiError(401, "No refresh token provided");
    const result = await authService.refresh(refreshToken);
    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions(result.user.role));
    res.status(200).json({ user: result.user, accessToken: result.accessToken });
  },

  async logout(req: Request, res: Response) {
    res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
    res.status(204).send();
  },
};
