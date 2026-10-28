import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseStaff, readJson } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const idx = db.staff.findIndex((s) => s.id === id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = parseStaff((await readJson(req)) ?? {});
  if (!parsed) return NextResponse.json({ error: "Invalid staff member" }, { status: 400 });
  db.staff[idx] = { id, ...parsed };
  return NextResponse.json(db.staff[idx]);
}
