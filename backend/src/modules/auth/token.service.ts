import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import type { UserRole } from "@festora/types";

export interface TokenSubject {
  id: string;
  role: UserRole;
}

function ttlForRole(role: UserRole) {
  return role === "admin" ? env.adminTokenTtl : env.userTokenTtl;
}

export const tokenService = {
  signAccessToken(user: TokenSubject) {
    return jwt.sign({ sub: user.id, role: user.role }, env.jwtAccessSecret, {
      expiresIn: ttlForRole(user.role),
    });
  },
  signRefreshToken(user: TokenSubject) {
    return jwt.sign({ sub: user.id, role: user.role }, env.jwtRefreshSecret, {
      expiresIn: ttlForRole(user.role),
    });
  },
  verifyRefreshToken(token: string) {
    return jwt.verify(token, env.jwtRefreshSecret) as { sub: string; role: UserRole };
  },
};
