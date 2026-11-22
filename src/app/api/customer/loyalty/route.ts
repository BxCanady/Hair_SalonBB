import { NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth";
import { getCustomerVisitRewards } from "@/lib/loyaltyDb";

export async function GET(req: Request) {
  if (!req.headers.has("authorization")) {
    return NextResponse.json({ error: "Sign in to view visit rewards" }, { status: 401 });
  }
  const user = await getVerifiedUser(req);
  if (!user) return NextResponse.json({ error: "Your session is invalid. Please sign in again." }, { status: 401 });

  try {
    return NextResponse.json(await getCustomerVisitRewards(user.id));
  } catch {
    console.error("Could not load customer visit rewards");
    return NextResponse.json({ error: "Visit rewards are temporarily unavailable" }, { status: 503 });
  }
}
