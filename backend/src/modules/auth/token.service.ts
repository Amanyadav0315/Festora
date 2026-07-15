import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import type { UserRole } from "@festora/types";

export interface TokenSubject {
  id: string;
  role: UserRole;
}

export const tokenService = {
  signAccessToken(user: TokenSubject) {
    return jwt.sign({ sub: user.id, role: user.role }, env.jwtAccessSecret, {
      expiresIn: env.accessTokenTtl,
    });
  },
  signRefreshToken(user: TokenSubject) {
    return jwt.sign({ sub: user.id, role: user.role }, env.jwtRefreshSecret, {
      expiresIn: env.refreshTokenTtl,
    });
  },
  verifyRefreshToken(token: string) {
    return jwt.verify(token, env.jwtRefreshSecret) as { sub: string; role: UserRole };
  },
};
