import type { Appointment, Service, Slot, Staff } from "./types";
import { toMinutes, toTime, weekday } from "./time";

export const SLOT_STEP_MIN = 30;

/** Does `candidate` (start, duration) clash with an active appointment of the same staff on the same date? */
export function hasConflict(
  appointments: Appointment[],
  services: Service[],
  staffId: string,
  date: string,
  time: string,
  durationMin: number,
  ignoreId?: string,
) {
  const start = toMinutes(time);
  const end = start + durationMin;
  return appointments.some((a) => {
    if (a.id === ignoreId || a.staffId !== staffId || a.date !== date || a.status === "cancelled") return false;
    const dur = services.find((s) => s.id === a.serviceId)?.durationMin ?? SLOT_STEP_MIN;
    const aStart = toMinutes(a.time);
    return start < aStart + dur && aStart < end;
  });
}

export function fitsWorkingHours(staff: Staff, date: string, time: string, durationMin: number) {
  const hours = staff.workingHours[weekday(date)];
  if (!hours) return false;
  const start = toMinutes(time);
  return start >= toMinutes(hours.start) && start + durationMin <= toMinutes(hours.end);
}

/**
 * Available slots for a service on a date. With `staffId` set, only that staff member is considered;
 * otherwise ("any available") each time is listed once, assigned to the first free staff member.
 * `now` (salon-local date + minutes) removes slots in the past.
 */
export function getAvailableSlots(opts: {
  service: Service;
  staff: Staff[];
  appointments: Appointment[];
  services: Service[];
  date: string;
  staffId?: string | null;
  now?: { date: string; minutes: number };
}): Slot[] {
  const { service, appointments, services, date, now } = opts;
  const candidates = opts.staff.filter(
    (s) => s.serviceIds.includes(service.id) && (!opts.staffId || s.id === opts.staffId),
  );
  const slots = new Map<string, Slot>();
  for (const s of candidates) {
    const hours = s.workingHours[weekday(date)];
    if (!hours) continue;
    for (let m = toMinutes(hours.start); m + service.durationMin <= toMinutes(hours.end); m += SLOT_STEP_MIN) {
      const time = toTime(m);
      if (slots.has(time)) continue;
      if (now && (date < now.date || (date === now.date && m <= now.minutes))) continue;
      if (hasConflict(appointments, services, s.id, date, time, service.durationMin)) continue;
      slots.set(time, { time, staffId: s.id });
    }
  }
  return [...slots.values()].sort((a, b) => a.time.localeCompare(b.time));
}
