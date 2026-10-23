import { NextResponse } from "next/server";
import { db, newId } from "@/lib/db";
import { parseStaff, readJson } from "@/lib/validate";

export async function GET() {
  return NextResponse.json(db.staff);
}

export async function POST(req: Request) {
  const parsed = parseStaff((await readJson(req)) ?? {});
  if (!parsed) return NextResponse.json({ error: "Invalid staff member" }, { status: 400 });
  const staff = { id: newId("stf"), ...parsed };
  db.staff.push(staff);
  return NextResponse.json(staff, { status: 201 });
}
