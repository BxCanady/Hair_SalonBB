import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { denyUnlessAdmin, getAdminId } from "@/lib/auth";
import { parseHairstyle, readJson } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  const h = db.hairstyles.find((x) => x.id === id);
  if (!h || (!h.isPublished && !(await getAdminId(req)))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(h);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await denyUnlessAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  const h = db.hairstyles.find((x) => x.id === id);
  if (!h) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const current = { title: h.title, description: h.description, imageUrl: h.imageUrl, serviceId: h.serviceId, priceCents: h.priceCents, durationMin: h.durationMin, isPublished: h.isPublished, sortOrder: h.sortOrder };
  const parsed = parseHairstyle({ ...current, ...((await readJson(req)) ?? {}) });
  if (!parsed) return NextResponse.json({ error: "Invalid hairstyle" }, { status: 400 });
  if (parsed.serviceId && !db.services.some((s) => s.id === parsed.serviceId)) {
    return NextResponse.json({ error: "Unknown service" }, { status: 400 });
  }
  Object.assign(h, parsed, { updatedAt: new Date().toISOString() });
  return NextResponse.json(h);
}

export async function DELETE(req: Request, { params }: Ctx) {
  const denied = await denyUnlessAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  const idx = db.hairstyles.findIndex((x) => x.id === id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.hairstyles.splice(idx, 1);
  return NextResponse.json({ ok: true });
}
