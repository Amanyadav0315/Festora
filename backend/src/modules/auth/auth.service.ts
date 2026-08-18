import bcrypt from "bcryptjs";
import { userRepository } from "../users/user.repository";
import { toUserDTO } from "../users/user.mapper";
import { tokenService } from "./token.service";
import { ApiError } from "../../middleware/errorHandler";
import { isDeletionExpired, purgeUserData } from "../users/accountDeletion.service";
import { otpService } from "../otp/otp.service";
import type { SignupInput, LoginInput, ResetPasswordInput } from "./auth.schemas";

const SALT_ROUNDS = 10;

export const authService = {
  async signup(input: SignupInput) {
    const existingPhone = await userRepository.findByPhone(input.phone);
    if (existingPhone) throw new ApiError(409, "Phone number already in use");

    if (input.email) {
      const existingEmail = await userRepository.findByEmail(input.email);
      if (existingEmail) throw new ApiError(409, "Email already in use");
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await userRepository.create({
      name: input.name,
      businessName: input.businessName,
      phone: input.phone,
      email: input.email,
      passwordHash,
      termsAcceptedAt: new Date(),
    });

    return buildAuthResult(user);
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByIdentifier(input.identifier);
    if (!user) throw new ApiError(401, "Invalid credentials");

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new ApiError(401, "Invalid credentials");

    // Admin-deleted accounts don't get the self-service auto-restore-on-login behavior below —
    // only an admin can bring them back, from the admin panel's Deleted Items screen.
    if ((user as any).adminDeletedAt) throw new ApiError(401, "Invalid credentials");

    if (user.deletionRequestedAt) {
      if (isDeletionExpired(user.deletionRequestedAt)) {
        // Grace period already elapsed — this account is effectively gone even if the
        // background sweep hasn't gotten to it yet. Purge it now and deny the login rather
        // than let someone log into an account that's supposed to be permanently deleted.
        await purgeUserData(user._id.toString());
        throw new ApiError(401, "Invalid credentials");
      }
      // Still within the 60-day window — logging back in restores the account.
      user.deletionRequestedAt = null;
      await user.save();
    }

    return buildAuthResult(user);
  },

  async resetPassword(input: ResetPasswordInput) {
    // Re-verifies (and consumes) the OTP here rather than trusting an earlier /otp/verify call
    // in isolation — the code must still be valid, unused, and unexpired at the exact moment
    // the password actually changes.
    await otpService.verifyOtp({ email: input.email, code: input.code, purpose: "reset" });

    const user = await userRepository.findByEmail(input.email);
    if (!user) throw new ApiError(404, "No account found with that email address");

    const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
    await userRepository.updatePasswordHash(user._id.toString(), passwordHash);

    return buildAuthResult(await userRepository.findById(user._id.toString()) as typeof user);
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
