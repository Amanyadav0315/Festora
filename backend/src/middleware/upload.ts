import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";

const UPLOAD_ROOT = path.join(__dirname, "..", "..", "uploads");

function makeStorage(subdir: string) {
  const dest = path.join(UPLOAD_ROOT, subdir);
  fs.mkdirSync(dest, { recursive: true });

  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  });
}

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function imageFileFilter(_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (!IMAGE_TYPES.has(file.mimetype)) {
    cb(new Error("Only JPEG, PNG, WEBP, or GIF images are allowed"));
    return;
  }
  cb(null, true);
}

export const uploadCategoryImage = multer({
  storage: makeStorage("categories"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

export function categoryImageUrl(filename: string): string {
  return `/uploads/categories/${filename}`;
}

export const uploadListingImages = multer({
  storage: makeStorage("listings"),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: imageFileFilter,
});

export function listingImageUrl(filename: string): string {
  return `/uploads/listings/${filename}`;
}

export const uploadChatImage = multer({
  storage: makeStorage("chat"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

export function chatImageUrl(filename: string): string {
  return `/uploads/chat/${filename}`;
}

export const uploadReportImages = multer({
  storage: makeStorage("reports"),
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
  fileFilter: imageFileFilter,
});

export function reportImageUrl(filename: string): string {
  return `/uploads/reports/${filename}`;
}