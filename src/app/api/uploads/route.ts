import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/auth";
import { uploadHairstyleImage, validateImage } from "@/lib/storage";

export async function POST(req: Request) {
  const denied = await denyUnlessAdmin(req);
  if (denied) return denied;
  if (Number(req.headers.get("content-length") ?? 0) > 6 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be 5 MB or smaller" }, { status: 413 });
  }
  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "A file is required" }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const checked = validateImage(file.type, bytes);
  if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 400 });
  const uploaded = await uploadHairstyleImage(bytes, file.type, checked.ext);
  if ("error" in uploaded) return NextResponse.json({ error: uploaded.error }, { status: 502 });
  return NextResponse.json({ url: uploaded.url }, { status: 201 });
}
