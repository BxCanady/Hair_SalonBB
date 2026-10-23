import type { Appointment, Service, Staff, WorkingHours } from "./types";

/**
 * In-memory mock database. The shapes match prisma/schema.prisma, so swapping
 * these arrays for Prisma/Supabase queries only requires changes in this file
 * and the route handlers. Data resets when the server restarts.
 */
type Store = { services: Service[]; staff: Staff[]; appointments: Appointment[] };

const weekdayHours = (start: string, end: string, sat = true): WorkingHours => [
  null,
  { start, end },
  { start, end },
  { start, end },
  { start, end },
  { start, end },
  sat ? { start: "10:00", end: "16:00" } : null,
];

function seed(): Store {
  return {
    services: [
      { id: "svc-cut", name: "Haircut", category: "Cuts", description: "Wash, cut and blow-dry.", durationMin: 45, priceCents: 5500 },
      { id: "svc-trim", name: "Quick Trim", category: "Cuts", description: "Tidy up the ends.", durationMin: 30, priceCents: 3000 },
      { id: "svc-color", name: "Full Coloring", category: "Color", description: "All-over color with gloss finish.", durationMin: 120, priceCents: 14000 },
      { id: "svc-highlight", name: "Highlights", category: "Color", description: "Partial foil highlights.", durationMin: 150, priceCents: 17000 },
      { id: "svc-style", name: "Styling", category: "Styling", description: "Blowout or special-occasion style.", durationMin: 60, priceCents: 6500 },
    ],
    staff: [
      { id: "stf-ava", name: "Ava Brooks", role: "Senior Stylist", email: "ava@hairsalonbb.test", serviceIds: ["svc-cut", "svc-trim", "svc-color", "svc-highlight", "svc-style"], workingHours: weekdayHours("09:00", "17:00") },
      { id: "stf-leo", name: "Leo Martin", role: "Stylist", email: "leo@hairsalonbb.test", serviceIds: ["svc-cut", "svc-trim", "svc-style"], workingHours: weekdayHours("11:00", "19:00", false) },
      { id: "stf-mia", name: "Mia Chen", role: "Colorist", email: "mia@hairsalonbb.test", serviceIds: ["svc-color", "svc-highlight", "svc-style"], workingHours: weekdayHours("09:00", "15:00") },
    ],
    appointments: [],
  };
}

const g = globalThis as unknown as { __salonStore?: Store };
export const db: Store = (g.__salonStore ??= seed());

export const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
