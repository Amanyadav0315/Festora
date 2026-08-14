import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { MulterError } from "multer";

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string>;

  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message, errors: err.errors });
  }
  if (err instanceof ZodError) {
    const errors: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "_";
      if (!errors[key]) errors[key] = issue.message;
    }
    return res.status(400).json({ message: "Invalid input", errors });
  }
  if (err instanceof MulterError) {
    // Multer's own errors (file too large, too many files, unexpected field) are already
    // safe, user-facing text — map the common ones to clean wording instead of the generic
    // 500 fallback, without ever forwarding Multer's internal error shape.
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "One of your files is too large. Please upload smaller images."
        : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE"
          ? "Too many files uploaded."
          : "There was a problem uploading your files. Please try again.";
    return res.status(400).json({ message });
  }
  // Never forward the raw error (message/stack/etc.) to the client for anything we didn't
  // deliberately throw as an ApiError above — only log it server-side and send back a clean,
  // generic message so no internal/technical detail (DB errors, stack traces, library internals)
  // ever reaches the frontend.
  console.error(err);
  res.status(500).json({ message: "Something went wrong. Please try again." });
}
