import { NextResponse } from "next/server";
import { db, newId } from "@/lib/db";
import { denyUnlessAdmin } from "@/lib/auth";
import { parseHairstyle, readJson } from "@/lib/validate";
import type { Hairstyle } from "@/lib/types";
import { enrichHairstylesWithImageAlternatives } from "@/lib/hairstyleImageCache";

const bySort = (a: Hairstyle, b: Hairstyle) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt);

/** Public: published hairstyles only. Administrators may pass ?all=1 to include unpublished ones. */
export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get("all") === "1") {
    const denied = await denyUnlessAdmin(req);
    if (denied) return denied;
    const hairstyles = await enrichHairstylesWithImageAlternatives([...db.hairstyles].sort(bySort));
    return NextResponse.json(hairstyles);
  }
  const hairstyles = await enrichHairstylesWithImageAlternatives(
    db.hairstyles.filter((h) => h.isPublished).sort(bySort),
  );
  return NextResponse.json(hairstyles);
}

export async function POST(req: Request) {
  const denied = await denyUnlessAdmin(req);
  if (denied) return denied;
  const b = (await readJson(req)) ?? {};
  const nextOrder = db.hairstyles.reduce((m, h) => Math.max(m, h.sortOrder), 0) + 1;
  const parsed = parseHairstyle({ isPublished: false, ...b, sortOrder: b.sortOrder ?? nextOrder });
  if (!parsed) return NextResponse.json({ error: "Invalid hairstyle" }, { status: 400 });
  if (parsed.serviceId && !db.services.some((s) => s.id === parsed.serviceId)) {
    return NextResponse.json({ error: "Unknown service" }, { status: 400 });
  }
  const now = new Date().toISOString();
  const hairstyle: Hairstyle = { id: newId("hs"), ...parsed, createdAt: now, updatedAt: now };
  db.hairstyles.push(hairstyle);
  return NextResponse.json(hairstyle, { status: 201 });
}
