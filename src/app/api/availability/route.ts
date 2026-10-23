import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAvailableSlots } from "@/lib/availability";
import { fmtDate, isValidDate } from "@/lib/time";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const service = db.services.find((s) => s.id === q.get("serviceId"));
  const date = q.get("date") ?? "";
  if (!service || !isValidDate(date)) return NextResponse.json({ error: "serviceId and date required" }, { status: 400 });
  const staffId = q.get("staffId") || null;
  const n = new Date();
  const slots = getAvailableSlots({
    service,
    staff: db.staff,
    appointments: db.appointments,
    services: db.services,
    date,
    staffId,
    now: { date: fmtDate(n), minutes: n.getHours() * 60 + n.getMinutes() },
  });
  return NextResponse.json(slots);
}
