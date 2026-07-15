import bcrypt from "bcryptjs";
import { userRepository } from "../users/user.repository";
import { toUserDTO } from "../users/user.mapper";
import { tokenService } from "./token.service";
import { ApiError } from "../../middleware/errorHandler";
import type { SignupInput, LoginInput } from "./auth.schemas";

const SALT_ROUNDS = 10;

export const authService = {
  async signup(input: SignupInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw new ApiError(409, "Email already in use");

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    });

    return buildAuthResult(user);
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) throw new ApiError(401, "Invalid email or password");

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new ApiError(401, "Invalid email or password");

    return buildAuthResult(user);
  },

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const user = await userRepository.findById(payload.sub);
    if (!user) throw new ApiError(401, "Invalid or expired refresh token");

    return buildAuthResult(user);
  },
};

function buildAuthResult(user: Awaited<ReturnType<typeof userRepository.create>>) {
  const subject = { id: user._id.toString(), role: user.role as any };
  return {
    user: toUserDTO(user),
    accessToken: tokenService.signAccessToken(subject),
    refreshToken: tokenService.signRefreshToken(subject),
  };
}
