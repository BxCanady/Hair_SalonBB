# Hair_SalonBB

Next.js (App Router, TypeScript, Tailwind CSS) PWA for a hair salon:

- **`/` and `/book`** – public booking flow: pick a service (grouped by category, with duration and price), a stylist or "Any available", a date and a live time slot, then enter name/email/phone and get an instant confirmation.
- **`/dashboard`** – staff dashboard: day/week/month schedule, accept / reschedule / cancel appointments, and CRUD for staff (profile, services, working hours) and services.
- **PWA** – `public/manifest.json`, `public/sw.js` (registered in production builds) and an `/offline` fallback page. API responses are never cached.

## Getting started

```bash
npm install
npm run dev                  # http://localhost:3000
npm run build && npm start   # production build (service worker active)
npm run lint
```

## Data layer

Data lives in an in-memory mock store (`src/lib/db.ts`, seeded with sample services and staff; it resets on restart). `prisma/schema.prisma` describes the equivalent Service / Staff / Appointment models so the store can be swapped for Prisma or Supabase by changing `src/lib/db.ts` and the route handlers in `src/app/api`. Slot calculation is in `src/lib/availability.ts` (30-minute grid, staff working hours, no overlap with active appointments).

> The dashboard has no authentication yet and its API routes are open; add auth before using real customer data.
