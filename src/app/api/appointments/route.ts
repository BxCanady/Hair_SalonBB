import { NextResponse } from "next/server";
import { db, newId } from "@/lib/db";
import { denyUnlessAdmin, getVerifiedUser } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rateLimit";
import { getAvailableSlots } from "@/lib/availability";
import { fmtDate, isValidDate, isValidTime } from "@/lib/time";
import { parseCustomer, readJson } from "@/lib/validate";
import type { Appointment } from "@/lib/types";
import { redeemVisitReward, refundVisitReward } from "@/lib/loyaltyDb";
import { VISIT_REWARD_CENTS } from "@/lib/loyalty";

export async function GET(req: Request) {
  const denied = await denyUnlessAdmin(req);
  if (denied) return denied;
  return NextResponse.json(db.appointments);
}

export async function POST(req: Request) {
  if (!rateLimit(`book:${clientKey(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }
  const hasAuth = req.headers.has("authorization");
  const user = hasAuth ? await getVerifiedUser(req) : null;
  if (hasAuth && !user) return NextResponse.json({ error: "Your session is invalid. Please sign in again." }, { status: 401 });
  const b = (await readJson(req)) ?? {};
  const customer = parseCustomer(b);
  const service = db.services.find((s) => s.id === b.serviceId);
  const date = String(b.date ?? "");
  const time = String(b.time ?? "");
  if (!customer || !service || !isValidDate(date) || !isValidTime(time) ||
      (b.applyVisitReward !== undefined && typeof b.applyVisitReward !== "boolean")) {
    return NextResponse.json({ error: "Invalid booking details" }, { status: 400 });
  }
  const applyVisitReward = b.applyVisitReward === true;
  if (applyVisitReward && !user) {
    return NextResponse.json({ error: "Sign in to use your visit reward" }, { status: 401 });
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
  const id = newId("apt");
  if (applyVisitReward && user) {
    let redeemed: boolean;
    try {
      redeemed = await redeemVisitReward(user.id, id);
    } catch {
      console.error("Could not redeem customer visit reward");
      return NextResponse.json({ error: "Visit rewards are temporarily unavailable. Your booking was not placed." }, { status: 503 });
    }
    if (!redeemed) return NextResponse.json({ error: "No visit reward is available. Refresh your reward status and try again." }, { status: 409 });
    const current = new Date();
    const stillAvailable = getAvailableSlots({
      service,
      staff: db.staff,
      appointments: db.appointments,
      services: db.services,
      date,
      staffId: typeof b.staffId === "string" && b.staffId !== "any" ? b.staffId : null,
      now: { date: fmtDate(current), minutes: current.getHours() * 60 + current.getMinutes() },
    }).some((candidate) => candidate.time === time && candidate.staffId === slot.staffId);
    if (!stillAvailable) {
      try {
        await refundVisitReward(user.id, id);
      } catch {
        console.error("Could not restore customer visit reward after booking conflict");
        return NextResponse.json({ error: "That time was taken, and your reward could not be restored. Please contact the salon before retrying." }, { status: 503 });
      }
      return NextResponse.json({ error: "That time is no longer available. Your visit reward was returned." }, { status: 409 });
    }
  }
  const appt: Appointment = {
    id,
    serviceId: service.id,
    staffId: slot.staffId,
    date,
    time,
    ...customer,
    customerUserId: user?.id ?? null,
    discountCents: applyVisitReward ? Math.min(VISIT_REWARD_CENTS, service.priceCents) : 0,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  db.appointments.push(appt);
  return NextResponse.json(appt, { status: 201 });
}
