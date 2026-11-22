# Hair_SalonBB

Next.js (App Router, TypeScript, Tailwind CSS) PWA for a hair salon:

- **`/` and `/book`** – public booking flow: pick a service (grouped by category, with duration and price), a stylist or "Any available", a date and a live time slot, then enter name/email/phone and get an instant confirmation.
- **`/dashboard`** – staff dashboard: day/week/month schedule, accept / reschedule / cancel appointments, and CRUD for staff (profile, services, working hours) and services.
- **Customer booking** – customers can sign in or join with Google/email, or continue as a guest. Authenticated customers earn $10 off for every 5 completed visits; the owner marks completed appointments in the dashboard.
- **PWA** – `public/manifest.json`, `public/sw.js` (registered in production builds) and an `/offline` fallback page. API responses are never cached.

## Getting started

```bash
npm install
npm run dev                  # http://localhost:3000
npm run build && npm start   # production build (service worker active)
npm run lint
npm test                     # unit tests (Vitest, node)
```

## Hairstyle gallery

- **Home (`/`)** shows a swipeable `HairstyleCarousel` (published hairstyles from `GET /api/hairstyles`). "Book This Style" links to `/book?serviceId=<id>`, which preselects that service.
- **Dashboard → Hairstyles** (`HairstyleManager`): upload photos, create/edit/delete, publish/unpublish, reorder, link a service, preview the customer card.

### Admin authentication

Admin routes verify a Supabase Auth access token server-side (`src/lib/auth.ts`) and then check the verified user id against `ADMIN_USER_IDS`. If these env vars are missing, admin routes return 503 (fail closed). Copy `.env.example` to `.env` and fill it in; create the admin user in Supabase Auth and put its user id in `ADMIN_USER_IDS`. Photo uploads go to a **public** Supabase Storage bucket named `hairstyles` using the server-only `SUPABASE_SERVICE_ROLE_KEY`; do not add public insert/update/delete policies to that bucket.

### Customer login and visit rewards

Copy `.env.example` to `.env` and configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `DIRECT_URL`. Enable Google in Supabase Auth and configure the Google OAuth client and redirect URLs. Email/password registration can require email confirmation; configure the Supabase Auth site URL and redirect allowlist for `/book`. Customer identity is verified server-side through Supabase Auth. Guests can book but do not earn rewards; older guest appointments are not credited retroactively.

The program awards $10 off after every five completed appointments. The owner marks completed appointments in the dashboard. Reward visit and redemption events are persisted in the Postgres tables from `supabase/migrations/`; apply and verify that migration before using the reward feature. RLS is enabled, with no client policies; only server-side database connections can access these tables.

### API

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/customer/loyalty` | Signed-in customer |
| GET | `/api/hairstyles` (`?all=1` includes drafts) | Public (published only) / admin for `all` |
| POST | `/api/hairstyles` | Admin |
| GET | `/api/hairstyles/[id]` | Public if published, else admin |
| PATCH / DELETE | `/api/hairstyles/[id]` | Admin |
| POST | `/api/uploads` (multipart `file`; JPEG/PNG/WebP ≤ 5 MB, content sniffed) | Admin |
| GET | `/api/services`, `/api/staff`, `/api/availability?serviceId=&date=&staffId=` | Public (availability rate limited) |
| PUT/POST/DELETE | `/api/services…`, `PUT /api/staff/[id]` | Admin |
| POST | `/api/appointments` (rate limited, 409 if the slot was taken) | Public |
| GET | `/api/appointments`, `PATCH /api/appointments/[id]` | Admin |


## Data layer

Appointments, services, and staff live in an in-memory mock store (`src/lib/db.ts`, seeded with sample services and staff; it resets on restart). Customer sign-in uses Supabase Auth. Visit and reward events are persisted to Postgres through the session-mode `DIRECT_URL` connection. Slot calculation is in `src/lib/availability.ts` (30-minute grid, staff working hours, no overlap with active appointments).

> Remaining limitation: appointment, service, and staff records still use the in-memory store, so bookings reset on restart and appointment overlap protection only spans one server process. The visit reward ledger itself is persistent and deduplicates completed visits/redemptions by appointment ID, but appointment records are not persisted yet.
