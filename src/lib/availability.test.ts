import { describe, expect, it } from "vitest";
import { fitsWorkingHours, getAvailableSlots, hasConflict } from "./availability";
import type { Appointment, Service, Staff, WorkingHours } from "./types";

const svc = (id: string, durationMin: number): Service => ({ id, name: id, category: "c", description: "", durationMin, priceCents: 1000 });
const hours: WorkingHours = Array.from({ length: 7 }, () => ({ start: "09:00", end: "12:00" }));
const staff: Staff = { id: "s1", name: "A", role: "r", email: "a@b.co", serviceIds: ["cut", "long"], workingHours: hours };
const appt = (over: Partial<Appointment>): Appointment => ({
  id: "a1", serviceId: "cut", staffId: "s1", date: "2030-01-07", time: "10:00",
  customerName: "n", customerEmail: "e@e.co", customerPhone: "1234567", status: "confirmed", createdAt: "", ...over,
});
const services = [svc("cut", 60), svc("long", 120)];
const DATE = "2030-01-07";

describe("hasConflict", () => {
  const existing = [appt({})]; // 10:00-11:00

  it("detects overlap at either edge and containment", () => {
    expect(hasConflict(existing, services, "s1", DATE, "10:30", 60)).toBe(true);
    expect(hasConflict(existing, services, "s1", DATE, "09:30", 60)).toBe(true);
    expect(hasConflict(existing, services, "s1", DATE, "09:00", 180)).toBe(true);
  });
  it("allows back-to-back appointments", () => {
    expect(hasConflict(existing, services, "s1", DATE, "11:00", 60)).toBe(false);
    expect(hasConflict(existing, services, "s1", DATE, "09:00", 60)).toBe(false);
  });
  it("ignores cancelled appointments, other staff and other dates", () => {
    expect(hasConflict([appt({ status: "cancelled" })], services, "s1", DATE, "10:00", 60)).toBe(false);
    expect(hasConflict(existing, services, "s2", DATE, "10:00", 60)).toBe(false);
    expect(hasConflict(existing, services, "s1", "2030-01-08", "10:00", 60)).toBe(false);
  });
  it("lets an appointment be ignored (rescheduling)", () => {
    expect(hasConflict(existing, services, "s1", DATE, "10:00", 60, "a1")).toBe(false);
  });
});

describe("fitsWorkingHours", () => {
  it("requires the whole service to fit", () => {
    expect(fitsWorkingHours(staff, DATE, "11:00", 60)).toBe(true);
    expect(fitsWorkingHours(staff, DATE, "11:30", 60)).toBe(false);
  });
  it("is false on days off", () => {
    const off = { ...staff, workingHours: hours.map((h, i) => (i === 1 ? null : h)) };
    expect(fitsWorkingHours(off, DATE, "10:00", 30)).toBe(false); // 2030-01-07 is a Monday
  });
});

describe("getAvailableSlots", () => {
  const base = { service: services[0], staff: [staff], services, date: DATE };

  it("lists half-hour slots inside working hours", () => {
    const slots = getAvailableSlots({ ...base, appointments: [] }).map((s) => s.time);
    expect(slots).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00"]);
  });
  it("removes booked time but not cancelled bookings", () => {
    const booked = getAvailableSlots({ ...base, appointments: [appt({})] }).map((s) => s.time);
    expect(booked).toEqual(["09:00", "11:00"]);
    const cancelled = getAvailableSlots({ ...base, appointments: [appt({ status: "cancelled" })] }).map((s) => s.time);
    expect(cancelled).toContain("10:00");
  });
  it("respects service duration at closing time", () => {
    const slots = getAvailableSlots({ ...base, service: services[1], appointments: [] }).map((s) => s.time);
    expect(slots).toEqual(["09:00", "09:30", "10:00"]);
  });
  it("drops past times for today", () => {
    const slots = getAvailableSlots({ ...base, appointments: [], now: { date: DATE, minutes: 10 * 60 } }).map((s) => s.time);
    expect(slots).toEqual(["10:30", "11:00"]);
    expect(getAvailableSlots({ ...base, appointments: [], now: { date: "2030-01-08", minutes: 0 } })).toEqual([]);
  });
  it("excludes staff who don't offer the service", () => {
    expect(getAvailableSlots({ ...base, staff: [{ ...staff, serviceIds: [] }], appointments: [] })).toEqual([]);
  });
});
