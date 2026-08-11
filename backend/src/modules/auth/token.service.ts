import jwt, { type SignOptions, type Secret } from "jsonwebtoken";
import { env } from "../../config/env";
import type { UserRole } from "@eventsaman/types";

export interface TokenSubject {
  id: string;
  role: UserRole;
}

function ttlForRole(role: UserRole): SignOptions["expiresIn"] {
  return (role === "admin" ? env.adminTokenTtl : env.userTokenTtl) as SignOptions["expiresIn"];
}

export const tokenService = {
  signAccessToken(user: TokenSubject) {
    return jwt.sign({ sub: user.id, role: user.role }, env.jwtAccessSecret as Secret, {
      expiresIn: ttlForRole(user.role),
    });
  },
  signRefreshToken(user: TokenSubject) {
    return jwt.sign({ sub: user.id, role: user.role }, env.jwtRefreshSecret as Secret, {
      expiresIn: ttlForRole(user.role),
    });
  },
  verifyRefreshToken(token: string) {
    return jwt.verify(token, env.jwtRefreshSecret) as { sub: string; role: UserRole };
  },
};
