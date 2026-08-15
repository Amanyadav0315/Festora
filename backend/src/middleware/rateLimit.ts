import rateLimit from "express-rate-limit";

// Applied globally: a generous ceiling that only kicks in against real abuse/scraping, not
// normal browsing.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down and try again shortly." },
});

// Tighter limit on login/signup — the main brute-force / credential-stuffing / fake-account
// target. Keyed by IP (default), so one abusive client can't lock out others.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please wait a few minutes and try again." },
});
