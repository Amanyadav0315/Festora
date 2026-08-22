import { Resend } from "resend";
import { env } from "../config/env";
import { ApiError } from "../middleware/errorHandler";

// Single point of contact for sending transactional email. Every other module (otp.service.ts,
// and anything added later) calls only `emailService.send(...)` and never touches Resend (or
// nodemailer/SES) directly — so switching the active provider back to AWS SES later means
// rewriting the inside of this one file, not hunting down every call site.

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (resendClient) return resendClient;
  if (!env.resendApiKey) {
    throw new ApiError(500, "Email sending isn't configured on this server yet.");
  }
  resendClient = new Resend(env.resendApiKey);
  return resendClient;
}

export const emailService = {
  async send(input: SendEmailInput): Promise<void> {
    const client = getResendClient();
    const { error } = await client.emails.send({
      from: `${env.fromName} <${env.fromEmail}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (error) {
      throw new ApiError(500, `Failed to send email: ${error.message}`);
    }
  },
};

/*
 * Switching back to AWS SES later:
 * 1. `pnpm add nodemailer @types/nodemailer` (already in package.json history — see git log)
 * 2. Replace the body of this file with a nodemailer transporter built from
 *    env.smtpHost / env.smtpPort / env.smtpUser / env.smtpPass (those fields already exist in
 *    env.ts, unused, for exactly this reason), keeping the same `emailService.send(...)` shape.
 * 3. Nothing outside this file needs to change — otp.service.ts only depends on the
 *    `emailService.send({ to, subject, html, text })` contract above.
 */
