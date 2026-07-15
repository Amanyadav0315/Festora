# Festora

Niche marketplace for event/celebration services in India.

## Category scope (STRICT — do not add categories outside this list)

1. Tent House / Mandap (sale + rental)
2. DJ & Sound
3. Photography / Videography Studios
4. Banquet Halls
5. Catering
6. Resorts / Farmhouses

Do not add categories outside this list without explicit user approval.

## No third-party services yet

This is a local-first build. The following are explicitly OUT OF SCOPE until the user asks for them:

- No payment gateway (Razorpay etc.)
- No email sending (Resend etc.)
- No SMS/OTP (Twilio etc.)
- No cloud media storage (Cloudinary etc.) — images are stored on local disk via multer
- No Redis / BullMQ / job queues — everything runs synchronously
- No real-time chat — build only after core booking/listing flow works

Do NOT wire up any of the above proactively, even if it seems like the "right" way to do something.
If a task seems to need one of these, stop and ask the user first.

## Stack

- Monorepo: pnpm workspaces + Turborepo
- `frontend/` — Next.js 15 (App Router), single app covering both buyer and vendor flows.
  Will split into separate vendor-dashboard/admin apps later — don't split preemptively.
- `backend/` — Express.js modular monolith. Each domain lives under `src/modules/<name>/`
  with `*.model.ts`, `*.repository.ts`, `*.service.ts`, `*.controller.ts`, `*.routes.ts`,
  `*.schemas.ts` (zod validation), and optionally `*.mapper.ts` (DB doc -> DTO).
- `packages/types` — shared TypeScript types/DTOs, consumed by both apps.
- `packages/ui` — shared React components.
- Database: MongoDB via Mongoose. Local via `docker-compose.yml` (`festora-mongo` on
  port 27017) or swap `MONGO_URI` for an Atlas free-tier connection string.
- Auth: email/password with JWT access token (returned in response body, stored in
  localStorage client-side) + refresh token (httpOnly cookie, scoped to `/api/auth`).
  No OTP, no email verification.
- RBAC: three roles only — `buyer`, `vendor`, `admin`. Enforced via `requireAuth` +
  `requireRole(...)` middleware in `backend/src/middleware/auth.ts`.
- File uploads: multer to local disk (`backend/uploads/`, gitignored), served at
  `/uploads/*`. Not Cloudinary.

## Module pattern (backend)

New domains should follow the existing modules (`auth`, `users`, `categories`, `stores`, `listings`)
as templates: routes -> controller -> service (if there's real logic) -> repository -> model,
DTOs shaped via `*.mapper.ts` using types from `@festora/types`. Validate all inputs with zod
schemas in `*.schemas.ts`.

## Running locally

```
docker compose up -d          # start MongoDB
pnpm install
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
pnpm --filter @festora/api seed   # seed categories, subcategories, demo vendors/listings
pnpm dev                          # runs backend (:4000) + frontend (:3000) via turbo
```

## Phased delivery

Work happens in reviewed phases (Phase 0: foundation/auth, Phase 1: listings/booking, ...).
Do not jump ahead to future-phase features (payments, chat, admin app split, etc.) without
the user explicitly asking. Stop after each phase for review.
