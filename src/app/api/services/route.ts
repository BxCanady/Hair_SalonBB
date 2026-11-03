import { NextResponse } from "next/server";
import { db, newId } from "@/lib/db";
import { denyUnlessAdmin } from "@/lib/auth";
import { parseService, readJson } from "@/lib/validate";

export async function GET() {
  return NextResponse.json(db.services);
}

export async function POST(req: Request) {
  const denied = await denyUnlessAdmin(req);
  if (denied) return denied;
  const parsed = parseService((await readJson(req)) ?? {});
  if (!parsed) return NextResponse.json({ error: "Invalid service" }, { status: 400 });
  const service = { id: newId("svc"), ...parsed };
  db.services.push(service);
  return NextResponse.json(service, { status: 201 });
}
