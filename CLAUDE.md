# Event Saman

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
- `frontend/` — Next.js 15 (App Router), the public site. No buyer/vendor split — every signed-in
  user can both browse/book and post their own store + listings. Runs on :3000.
- `admin/` — Next.js 15 (App Router), standalone admin panel app. Runs on :3001. Admin-only
  auth (checks `role === "admin"`, redirects otherwise). Currently manages categories/subcategories;
  listings/users/vendors management is a future phase.
- `backend/` — Express.js modular monolith. Each domain lives under `src/modules/<name>/`
  with `*.model.ts`, `*.repository.ts`, `*.service.ts`, `*.controller.ts`, `*.routes.ts`,
  `*.schemas.ts` (zod validation), and optionally `*.mapper.ts` (DB doc -> DTO).
- `packages/types` — shared TypeScript types/DTOs, consumed by both apps.
- `packages/ui` — shared React components.
- Database: MongoDB via Mongoose. Local via `docker-compose.yml` (`eventsaman-mongo` on
  port 27017) or swap `MONGO_URI` for an Atlas free-tier connection string.
- Auth: email/password with JWT access token (returned in response body, stored in
  localStorage client-side) + refresh token (httpOnly cookie, scoped to `/api/auth`).
  No OTP, no email verification.
- RBAC: two roles only — `user`, `admin`. Every `user` can create a store and post listings
  (no separate vendor role/approval step). Enforced via `requireAuth` + `requireRole(...)`
  middleware in `backend/src/middleware/auth.ts`.
- File uploads: multer to local disk (`backend/uploads/`, gitignored), served at
  `/uploads/*`. Not Cloudinary.

## Module pattern (backend)

New domains should follow the existing modules (`auth`, `users`, `categories`, `stores`, `listings`)
as templates: routes -> controller -> service (if there's real logic) -> repository -> model,
DTOs shaped via `*.mapper.ts` using types from `@eventsaman/types`. Validate all inputs with zod
schemas in `*.schemas.ts`.

## Running locally

```
docker compose up -d          # start local MongoDB (eventsaman-mongo container)
pnpm install
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
cp admin/.env.local.example admin/.env.local
pnpm --filter @eventsaman/api seed   # seed categories, subcategories, admin account
pnpm dev                          # runs backend (:4000) + frontend (:3000) + admin (:3001) via turbo
```

Local dev always targets local Mongo (`mongodb://localhost:27017/eventsaman`) and
`http://localhost:4000/api` — never the production Atlas cluster. `.env` / `.env.local` are
gitignored and machine-specific; don't commit real secrets or the Atlas password into them.

## Production deployment (eventsaman.com)

Production config lives in `backend/.env.production.example`, `frontend/.env.production.example`,
and `admin/.env.production.example` — copy each to the matching `.env`/`.env.local` **only on the
AWS server**, filling in the real Atlas password and freshly generated JWT secrets (never reuse the
dev secrets). Production points at the `eventsamancluster` MongoDB Atlas cluster and the
`api.eventsaman.com` / `eventsaman.com` / `admin.eventsaman.com` domains, fronted by Nginx on a
single EC2 instance (see deployment notes discussed with the user for the t3.micro + swap + PM2 setup).

## Phased delivery

Work happens in reviewed phases (Phase 0: foundation/auth, Phase 1: listings/booking, ...).
Do not jump ahead to future-phase features (payments, chat, admin app split, etc.) without
the user explicitly asking. Stop after each phase for review.
