import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { env } from "./config/env";
import { authRouter } from "./modules/auth/auth.routes";
import { userRouter } from "./modules/users/user.routes";
import { categoryRouter } from "./modules/categories/category.routes";
import { subcategoryRouter } from "./modules/categories/subcategory.routes";
import { storeRouter } from "./modules/stores/store.routes";
import { listingRouter } from "./modules/listings/listing.routes";
import { socialRouter } from "./modules/social/social.routes";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/categories", categoryRouter);
  app.use("/api/subcategories", subcategoryRouter);
  app.use("/api/stores", storeRouter);
  app.use("/api/listings", listingRouter);
  app.use("/api/social", socialRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
