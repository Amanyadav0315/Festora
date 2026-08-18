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
  // AWS SES SMTP credentials for sending OTP emails (see otp.service.ts). Left optional rather
  // than required() so the rest of the app still boots on a machine that hasn't set these up
  // yet — otp.service.ts throws a clear config error only when an email actually needs sending.
  smtpHost: process.env.AWS_SES_SMTP_HOST,
  smtpPort: Number(process.env.AWS_SES_SMTP_PORT ?? 587),
  smtpUser: process.env.AWS_SES_SMTP_USER,
  smtpPass: process.env.AWS_SES_SMTP_PASS,
  fromEmail: process.env.FROM_EMAIL ?? "noreply@eventsaman.com",
  siteUrl: process.env.SITE_URL ?? "https://eventsaman.com",
};
