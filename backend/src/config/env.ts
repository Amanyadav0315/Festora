import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGO_URI ?? "mongodb://localhost:27017/eventsaman",
  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),
  adminTokenTtl: process.env.ADMIN_TOKEN_TTL ?? "24h",
  userTokenTtl: process.env.USER_TOKEN_TTL ?? "30d",
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:3000,http://localhost:3001")
    .split(",")
    .map((origin) => origin.trim()),
  // Email sending is currently done via Resend (see src/lib/email.service.ts) — the active
  // provider while AWS SES production access is pending. Left optional rather than required()
  // so the rest of the app still boots on a machine that hasn't set this up yet;
  // email.service.ts throws a clear config error only when an email actually needs sending.
  resendApiKey: process.env.RESEND_API_KEY,
  // AWS SES SMTP credentials — kept here, unused, so switching the active provider back to SES
  // later is just swapping the implementation in email.service.ts, not re-plumbing env vars.
  smtpHost: process.env.AWS_SES_SMTP_HOST,
  smtpPort: Number(process.env.AWS_SES_SMTP_PORT ?? 587),
  smtpUser: process.env.AWS_SES_SMTP_USER,
  smtpPass: process.env.AWS_SES_SMTP_PASS,
  fromEmail: process.env.FROM_EMAIL ?? "noreply@eventsaman.com",
  fromName: process.env.FROM_NAME ?? "Event Saman",
  siteUrl: process.env.SITE_URL ?? "https://eventsaman.com",
};
