import type { Appointment, Hairstyle, Service, Staff, WorkingHours } from "./types";

/**
 * In-memory mock database. The shapes match prisma/schema.prisma, so swapping
 * these arrays for Prisma/Supabase queries only requires changes in this file
 * and the route handlers. Data resets when the server restarts.
 */
type Store = { services: Service[]; staff: Staff[]; appointments: Appointment[]; hairstyles: Hairstyle[] };

const sampleHairstyle = (n: number, title: string, description: string, imageUrl: string, serviceId: string, priceCents: number, durationMin: number): Hairstyle => {
  const now = new Date().toISOString();
  return { id: `hs-sample-${n}`, title, description, imageUrl, serviceId, priceCents, durationMin, isPublished: true, sortOrder: n, createdAt: now, updatedAt: now };
};

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
      { id: "stf-ava", name: "Ava Brooks", role: "Owner & Stylist", email: "ava@hairsalonbb.test", serviceIds: ["svc-cut", "svc-trim", "svc-color", "svc-highlight", "svc-style"], workingHours: weekdayHours("09:00", "17:00") },
    ],
    appointments: [],
    hairstyles: [
      sampleHairstyle(1, "Micro Locs", "Fine, lightweight locs installed with precision.", "/images/styles/micro-locs.jpg", "svc-style", 25000, 360),
      sampleHairstyle(2, "Custom Braided Perfection", "Tailored braids finished to your vision.", "/images/styles/custom-braids.jpg", "svc-style", 15000, 240),
      sampleHairstyle(3, "Short Hair Gripper", "A clean, secure style for shorter hair.", "/images/styles/short-hair.jpg", "svc-cut", 8000, 90),
    ],
  };
}

const g = globalThis as unknown as { __salonStore?: Store };
const store = g.__salonStore ?? seed();
const owner = store.staff[0] ?? seed().staff[0];
store.hairstyles ??= seed().hairstyles;
store.staff = [owner];
store.appointments.forEach((appointment) => {
  appointment.staffId = owner.id;
});
export const db: Store = (g.__salonStore ??= store);

export const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
