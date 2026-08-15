import fs from "node:fs";
import path from "node:path";
import type { Request, Response } from "express";

const LOG_FILE = path.join(__dirname, "..", "..", "..", "logs", "audit.log");

// Caps how much of the (potentially large, ever-growing) flat log file we ever read per
// request — we only ever need the most recent slice for the admin viewer, never the whole
// history in memory.
const MAX_LINES_SCANNED = 20_000;

interface AuditEntry {
  time: string;
  method: string;
  path: string;
  status: number;
  userId: string | null;
  ip: string;
}

export const auditLogController = {
  // GET /admin/audit-log?page=&limit=&method=&search= — newest first. Reads the flat
  // append-only log file (there's no DB collection for this — see auditLog.ts middleware),
  // so pagination is done in-memory over the most recent MAX_LINES_SCANNED entries.
  async list(req: Request, res: Response) {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? "50"), 10) || 50));
    const methodFilter = typeof req.query.method === "string" ? req.query.method.toUpperCase() : undefined;
    const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : undefined;

    if (!fs.existsSync(LOG_FILE)) {
      return res.json({ entries: [], total: 0, page, limit });
    }

    const raw = fs.readFileSync(LOG_FILE, "utf8");
    const lines = raw.split("\n").filter(Boolean);
    const recent = lines.slice(-MAX_LINES_SCANNED);

    let entries: AuditEntry[] = [];
    for (const line of recent) {
      try {
        entries.push(JSON.parse(line));
      } catch {
        // Skip malformed/partial lines (e.g. a write in progress when read).
      }
    }
    entries.reverse(); // newest first

    if (methodFilter) entries = entries.filter((e) => e.method === methodFilter);
    if (search) {
      entries = entries.filter(
        (e) =>
          e.path.toLowerCase().includes(search) ||
          (e.userId ?? "").toLowerCase().includes(search) ||
          e.ip.toLowerCase().includes(search)
      );
    }

    const total = entries.length;
    const start = (page - 1) * limit;
    res.json({ entries: entries.slice(start, start + limit), total, page, limit });
  },
};
