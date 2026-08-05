import fs from "node:fs";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";

const LOG_DIR = path.join(__dirname, "..", "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "audit.log");
fs.mkdirSync(LOG_DIR, { recursive: true });

const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

export function auditLog(req: Request, res: Response, next: NextFunction) {
  if (!MUTATING_METHODS.has(req.method)) return next();

  res.on("finish", () => {
    const entry = {
      time: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      userId: req.user?.sub ?? null,
      ip: req.ip,
    };
    fs.appendFile(LOG_FILE, `${JSON.stringify(entry)}\n`, () => {});
  });

  next();
}
