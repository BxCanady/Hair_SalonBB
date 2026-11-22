import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { denyUnlessAdmin } from "@/lib/auth";
import { fitsWorkingHours, hasConflict } from "@/lib/availability";
import { isValidDate, isValidTime } from "@/lib/time";
import { readJson } from "@/lib/validate";
import { recordCompletedVisit, redeemVisitReward, refundVisitReward } from "@/lib/loyaltyDb";

type Ctx = { params: Promise<{ id: string }> };

/** Body: { status: "confirmed" | "cancelled" | "completed" } and/or { date, time, staffId? } to reschedule. */
export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await denyUnlessAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  const appt = db.appointments.find((a) => a.id === id);
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const b = (await readJson(req)) ?? {};

  if (b.status !== undefined && b.status !== "confirmed" && b.status !== "cancelled" && b.status !== "pending" && b.status !== "completed") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const nextStatus = (b.status as typeof appt.status | undefined) ?? appt.status;
  const rescheduling = b.date !== undefined || b.time !== undefined || b.staffId !== undefined;
  const reactivating = appt.status === "cancelled" && nextStatus !== "cancelled";
  let newSchedule: { date: string; time: string; staffId: string } | null = null;

  if (appt.status === "completed" && (nextStatus !== "completed" || rescheduling)) {
    return NextResponse.json({ error: "Completed appointments cannot be changed" }, { status: 409 });
  }

  if (reactivating && nextStatus === "completed") {
    return NextResponse.json({ error: "Reactivate a cancelled appointment before completing it" }, { status: 409 });
  }

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
    newSchedule = { date, time, staffId };
  }
  if (reactivating && appt.customerUserId && (appt.discountCents ?? 0) > 0) {
    try {
      if (!(await redeemVisitReward(appt.customerUserId, appt.id))) {
        return NextResponse.json({ error: "The visit reward is no longer available. The appointment was not reactivated." }, { status: 409 });
      }
    } catch {
      console.error("Could not restore customer visit reward");
      return NextResponse.json({ error: "Visit reward service is unavailable. The appointment was not reactivated." }, { status: 503 });
    }
  }
  if (nextStatus === "cancelled" && appt.status !== "cancelled" && appt.customerUserId && (appt.discountCents ?? 0) > 0) {
    try {
      await refundVisitReward(appt.customerUserId, appt.id);
    } catch {
      console.error("Could not refund customer visit reward");
      return NextResponse.json({ error: "Visit reward service is unavailable. The appointment was not cancelled." }, { status: 503 });
    }
  }
  if (nextStatus === "completed" && appt.status !== "completed" && appt.customerUserId) {
    try {
      await recordCompletedVisit(appt.customerUserId, appt.id);
    } catch {
      console.error("Could not record customer completed visit");
      return NextResponse.json({ error: "Visit reward service is unavailable. The appointment was not completed." }, { status: 503 });
    }
  }
  if (newSchedule) Object.assign(appt, newSchedule);
  appt.status = nextStatus;
  return NextResponse.json(appt);
}
