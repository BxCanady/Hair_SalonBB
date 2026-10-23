import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseService, readJson } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const idx = db.services.findIndex((s) => s.id === id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = parseService((await readJson(req)) ?? {});
  if (!parsed) return NextResponse.json({ error: "Invalid service" }, { status: 400 });
  db.services[idx] = { id, ...parsed };
  return NextResponse.json(db.services[idx]);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const idx = db.services.findIndex((s) => s.id === id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (db.appointments.some((a) => a.serviceId === id && a.status !== "cancelled")) {
    return NextResponse.json({ error: "Service has active appointments" }, { status: 409 });
  }
  db.services.splice(idx, 1);
  db.staff.forEach((s) => (s.serviceIds = s.serviceIds.filter((x) => x !== id)));
  return NextResponse.json({ ok: true });
}
