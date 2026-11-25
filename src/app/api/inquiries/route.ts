import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/auth";
import { createStyleInquiry, listStyleInquiries } from "@/lib/inquiries";
import { clientKey, rateLimit } from "@/lib/rateLimit";
import { readJson } from "@/lib/validate";

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export async function GET(request: Request) {
  const denied = await denyUnlessAdmin(request);
  if (denied) return denied;
  try {
    return NextResponse.json(await listStyleInquiries());
  } catch (error) {
    console.error("Could not load style inquiries.", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Inquiry inbox is temporarily unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!rateLimit(`inquiry:${clientKey(request)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many inquiries. Please try again shortly." }, { status: 429 });
  }
  const body = (await readJson(request)) ?? {};
  const styleName = clean(body.styleName, 120);
  const customerName = clean(body.customerName, 100);
  const customerEmail = clean(body.customerEmail, 160).toLowerCase();
  const customerPhone = clean(body.customerPhone, 30);
  const message = clean(body.message, 1000);
  const rawSourceUrl = clean(body.sourceUrl, 1000);
  let sourceUrl: string | null = null;
  if (rawSourceUrl) {
    try {
      const url = new URL(rawSourceUrl);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      sourceUrl = url.toString();
    } catch {
      return NextResponse.json({ error: "Invalid style source URL" }, { status: 400 });
    }
  }
  if (
    !styleName ||
    !customerName ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) ||
    !/^[\d\s()+.-]{7,}$/.test(customerPhone)
  ) {
    return NextResponse.json({ error: "Please complete the style and contact details" }, { status: 400 });
  }

  try {
    const inquiry = await createStyleInquiry({
      styleName,
      customerName,
      customerEmail,
      customerPhone,
      message,
      sourceUrl,
    });
    return NextResponse.json(inquiry, { status: 201 });
  } catch (error) {
    console.error("Could not create style inquiry.", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Your inquiry could not be sent. Please try again." }, { status: 503 });
  }
}
