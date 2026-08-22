import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "node:path";
import { env } from "./config/env";
import { authRouter } from "./modules/auth/auth.routes";
import { otpRouter } from "./modules/otp/otp.routes";
import { userRouter } from "./modules/users/user.routes";
import { categoryRouter } from "./modules/categories/category.routes";
import { subcategoryRouter } from "./modules/categories/subcategory.routes";
import { storeRouter } from "./modules/stores/store.routes";
import { listingRouter } from "./modules/listings/listing.routes";
import { socialRouter } from "./modules/social/social.routes";
import { wishlistRouter } from "./modules/wishlist/wishlist.routes";
import { chatRouter } from "./modules/chat/chat.routes";
import { supportRouter } from "./modules/support/support.routes";
import { adminRouter } from "./modules/admin/admin.routes";
import { reviewRouter } from "./modules/reviews/review.routes";
import { notificationRouter } from "./modules/notifications/notification.routes";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";
import { auditLog } from "./middleware/auditLog";
import { globalLimiter } from "./middleware/rateLimit";

export function createApp() {
  const app = express();

  // Behind Nginx in production, req.ip/X-Forwarded-For is only trustworthy once Express knows
  // there's exactly one reverse proxy in front of it — without this, express-rate-limit throws
  // (it refuses to key rate limits off a spoofable X-Forwarded-For by default).
  app.set("trust proxy", 1);

  // crossOriginResourcePolicy relaxed so uploaded images (served from /uploads) can still be
  // embedded by the frontend/admin apps on their own origins.
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
  app.use(auditLog);
  app.use("/api", globalLimiter);

  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRouter);
  app.use("/api/otp", otpRouter);
  app.use("/api/users", userRouter);
  app.use("/api/categories", categoryRouter);
  app.use("/api/subcategories", subcategoryRouter);
  app.use("/api/stores", storeRouter);
  app.use("/api/listings", listingRouter);
  app.use("/api/social", socialRouter);
  app.use("/api/wishlist", wishlistRouter);
  app.use("/api/chats", chatRouter);
  app.use("/api/support", supportRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/reviews", reviewRouter);
  app.use("/api/notifications", notificationRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
