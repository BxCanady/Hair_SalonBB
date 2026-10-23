import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fitsWorkingHours, hasConflict } from "@/lib/availability";
import { isValidDate, isValidTime } from "@/lib/time";
import { readJson } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

/** Body: { status: "confirmed" | "cancelled" } and/or { date, time, staffId? } to reschedule. */
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const appt = db.appointments.find((a) => a.id === id);
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const b = (await readJson(req)) ?? {};

  if (b.status !== undefined && b.status !== "confirmed" && b.status !== "cancelled" && b.status !== "pending") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const nextStatus = (b.status as typeof appt.status | undefined) ?? appt.status;
  const rescheduling = b.date !== undefined || b.time !== undefined || b.staffId !== undefined;
  const reactivating = appt.status === "cancelled" && nextStatus !== "cancelled";

  if (rescheduling || reactivating) {
    const date = String(b.date ?? appt.date);
    const time = String(b.time ?? appt.time);
    const staffId = String(b.staffId ?? appt.staffId);
    const service = db.services.find((s) => s.id === appt.serviceId);
    const staff = db.staff.find((s) => s.id === staffId);
    if (!service || !staff || !isValidDate(date) || !isValidTime(time)) {
      return NextResponse.json({ error: "Invalid reschedule details" }, { status: 400 });
    }
    if (!staff.serviceIds.includes(service.id) || !fitsWorkingHours(staff, date, time, service.durationMin)) {
      return NextResponse.json({ error: "Outside staff working hours" }, { status: 409 });
    }
    if (hasConflict(db.appointments, db.services, staffId, date, time, service.durationMin, id)) {
      return NextResponse.json({ error: "Time slot is already booked" }, { status: 409 });
    }
    Object.assign(appt, { date, time, staffId });
  }
  appt.status = nextStatus;
  return NextResponse.json(appt);
}
