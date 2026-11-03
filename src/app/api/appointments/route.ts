import { NextResponse } from "next/server";
import { db, newId } from "@/lib/db";
import { denyUnlessAdmin } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rateLimit";
import { getAvailableSlots } from "@/lib/availability";
import { fmtDate, isValidDate, isValidTime } from "@/lib/time";
import { parseCustomer, readJson } from "@/lib/validate";
import type { Appointment } from "@/lib/types";

export async function GET(req: Request) {
  const denied = await denyUnlessAdmin(req);
  if (denied) return denied;
  return NextResponse.json(db.appointments);
}

export async function POST(req: Request) {
  if (!rateLimit(`book:${clientKey(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }
  const b = (await readJson(req)) ?? {};
  const customer = parseCustomer(b);
  const service = db.services.find((s) => s.id === b.serviceId);
  const date = String(b.date ?? "");
  const time = String(b.time ?? "");
  if (!customer || !service || !isValidDate(date) || !isValidTime(time)) {
    return NextResponse.json({ error: "Invalid booking details" }, { status: 400 });
  }
  const n = new Date();
  const slots = getAvailableSlots({
    service,
    staff: db.staff,
    appointments: db.appointments,
    services: db.services,
    date,
    staffId: typeof b.staffId === "string" && b.staffId !== "any" ? b.staffId : null,
    now: { date: fmtDate(n), minutes: n.getHours() * 60 + n.getMinutes() },
  });
  const slot = slots.find((s) => s.time === time);
  if (!slot) return NextResponse.json({ error: "That time is no longer available" }, { status: 409 });
  const appt: Appointment = {
    id: newId("apt"),
    serviceId: service.id,
    staffId: slot.staffId,
    date,
    time,
    ...customer,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  db.appointments.push(appt);
  return NextResponse.json(appt, { status: 201 });
}

