import { NextResponse } from "next/server";
import { db, newId } from "@/lib/db";
import { parseService, readJson } from "@/lib/validate";

export async function GET() {
  return NextResponse.json(db.services);
}

export async function POST(req: Request) {
  const parsed = parseService((await readJson(req)) ?? {});
  if (!parsed) return NextResponse.json({ error: "Invalid service" }, { status: 400 });
  const service = { id: newId("svc"), ...parsed };
  db.services.push(service);
  return NextResponse.json(service, { status: 201 });
}
