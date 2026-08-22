import { env } from "../../config/env";
import { ApiError } from "../../middleware/errorHandler";
import { emailService } from "../../lib/email.service";
import { OtpModel } from "./otp.model";
import type { SendOtpInput, VerifyOtpInput } from "./otp.schemas";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_OTPS_PER_HOUR = 3;

// Domains that only exist to receive disposable/throwaway mail — signing up or resetting a
// password with one of these means there's no real inbox behind it to actually verify.
// Matched as a suffix so subdomains (e.g. anything.mailinator.com) are caught too.
const DISPOSABLE_DOMAINS = [
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "guerrillamail.biz",
  "guerrillamail.de",
  "sharklasers.com",
  "tempmail.com",
  "temp-mail.org",
  "throwam.com",
  "throwawaymail.com",
  "yopmail.com",
];

function assertNotDisposable(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const isDisposable = DISPOSABLE_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
  if (isDisposable) {
    throw new ApiError(400, "Please use a permanent email address — disposable/temporary email addresses aren't accepted.");
  }
}

function generateCode(): string {
  // A cryptographically-uninteresting 6-digit code is fine here — it's a short-lived,
  // rate-limited, single-use code, not a long-term secret.
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const PURPOSE_COPY: Record<string, { subject: string; heading: string; intro: string }> = {
  signup: {
    subject: "Verify your Event Saman account",
    heading: "Verify your email address",
    intro: "Use the verification code below to verify your email address and finish creating your Event Saman account.",
  },
  reset: {
    subject: "Reset your Event Saman password",
    heading: "Reset your password",
    intro: "Use the verification code below to reset your Event Saman account password.",
  },
  "email-change": {
    subject: "Confirm your Event Saman email address",
    heading: "Confirm your new email address",
    intro: "Use the verification code below to confirm this email address on your Event Saman account.",
  },
};

function buildEmailHtml(purpose: string, code: string, resetLink?: string) {
  const copy = PURPOSE_COPY[purpose] ?? PURPOSE_COPY.signup;
  const linkBlock = resetLink
    ? `<p style="margin:24px 0 0;font-size:14px;color:#4b5563;">You can also complete this by opening the link below:</p>
       <p style="margin:8px 0 0;word-break:break-all;"><a href="${resetLink}" style="color:#E65100;font-size:14px;">${resetLink}</a></p>`
    : "";

  return `
  <div style="background-color:#f9fafb;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background-color:#E65100;padding:20px 24px;">
        <span style="color:#ffffff;font-size:18px;font-weight:bold;">Event Saman</span>
      </div>
      <div style="padding:28px 24px;">
        <h1 style="margin:0 0 12px;font-size:18px;color:#111827;">${copy.heading}</h1>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4b5563;">${copy.intro}</p>
        <div style="text-align:center;margin:24px 0;">
          <span style="display:inline-block;letter-spacing:6px;font-size:28px;font-weight:bold;color:#E65100;background:#fff3e0;padding:14px 24px;border-radius:8px;">${code}</span>
        </div>
        <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Valid for 5 minutes.</p>
        <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Do not share this code with anyone.</p>
        <p style="margin:0;font-size:13px;color:#6b7280;">If you did not request this, ignore this email.</p>
        ${linkBlock}
      </div>
      <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">Event Saman - eventsaman.com</p>
      </div>
    </div>
  </div>`;
}

function buildEmailText(purpose: string, code: string, resetLink?: string) {
  const copy = PURPOSE_COPY[purpose] ?? PURPOSE_COPY.signup;
  const lines = [
    "Event Saman",
    "",
    copy.heading,
    copy.intro,
    "",
    `Verification code: ${code}`,
    "",
    "Valid for 5 minutes.",
    "Do not share this code with anyone.",
    "If you did not request this, ignore this email.",
  ];
  if (resetLink) {
    lines.push("", `You can also complete this by opening this link: ${resetLink}`);
  }
  lines.push("", "Event Saman - eventsaman.com");
  return lines.join("\n");
}

export const otpService = {
  async sendOtp(input: SendOtpInput) {
    const email = input.email.toLowerCase().trim();
    assertNotDisposable(email);

    const since = new Date(Date.now() - RESEND_WINDOW_MS);
    const recentCount = await OtpModel.countDocuments({ email, createdAt: { $gte: since } });
    if (recentCount >= MAX_OTPS_PER_HOUR) {
      throw new ApiError(429, "Too many verification codes requested for this email. Please try again in an hour.");
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await OtpModel.create({ email, code, purpose: input.purpose, expiresAt, isUsed: false });

    // Only the "reset" flow's email carries a clickable link (opens the forgot-password page
    // straight into the OTP step, with the email and code prefilled) — signup/email-change
    // happen from within the app itself, so there's nowhere useful for that link to point yet.
    const resetLink =
      input.purpose === "reset"
        ? `${env.siteUrl}/forgot-password?email=${encodeURIComponent(email)}&code=${code}`
        : undefined;

    const copy = PURPOSE_COPY[input.purpose] ?? PURPOSE_COPY.signup;
    await emailService.send({
      to: email,
      subject: copy.subject,
      html: buildEmailHtml(input.purpose, code, resetLink),
      text: buildEmailText(input.purpose, code, resetLink),
    });

    return { expiresInSeconds: OTP_TTL_MS / 1000 };
  },

  // Checks a code without consuming it. Used both by the standalone POST /otp/verify route
  // and internally by consumeOtp below — kept separate so the "reset" flow can validate the
  // same code twice (once when the user types it in on the OTP screen, again right before
  // actually changing the password) without the first check burning it.
  async checkOtp(input: VerifyOtpInput) {
    const email = input.email.toLowerCase().trim();
    const record = await OtpModel.findOne({
      email,
      purpose: input.purpose,
      code: input.code,
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!record) throw new ApiError(400, "Incorrect or already-used code. Please check the code and try again.");
    if (record.expiresAt.getTime() < Date.now()) {
      throw new ApiError(400, "This code has expired. Please request a new one.");
    }
    return record;
  },

  // Validates a code and, for one-shot purposes (signup, email-change), marks it used right
  // away so it can't be replayed. The "reset" purpose is deliberately NOT consumed here —
  // resetPassword() below re-validates and consumes it as the very last step of actually
  // changing the password, so the code the user is shown/typed keeps working right up until
  // the password is changed, and only then becomes single-use.
  async verifyOtp(input: VerifyOtpInput) {
    const record = await this.checkOtp(input);
    if (input.purpose !== "reset") {
      record.isUsed = true;
      await record.save();
    }
    return true;
  },

  // Final consumption of a "reset"-purpose code, called from auth.service.ts's resetPassword
  // right before the password is actually changed. Marks the code used so it can't be reused
  // for a second reset afterwards.
  async consumeResetOtp(email: string, code: string) {
    const record = await this.checkOtp({ email, code, purpose: "reset" });
    record.isUsed = true;
    await record.save();
  },
};
