import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/auth";
import { updateStyleInquiryStatus } from "@/lib/inquiries";
import { readJson } from "@/lib/validate";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  const { id } = await context.params;
  const body = (await readJson(request)) ?? {};
  if (body.status !== "new" && body.status !== "contacted" && body.status !== "closed") {
    return NextResponse.json({ error: "Invalid inquiry status" }, { status: 400 });
  }
  try {
    await updateStyleInquiryStatus(id, body.status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Could not update style inquiry.", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not update inquiry" }, { status: 503 });
  }
}
