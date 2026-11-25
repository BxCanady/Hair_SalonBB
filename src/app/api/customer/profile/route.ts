import { NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth";
import { buildCustomerProfileData } from "@/lib/customerProfile";
import { db } from "@/lib/db";
import { getCustomerVisitHistory, getCustomerVisitRewards } from "@/lib/loyaltyDb";

export async function GET(req: Request) {
  if (!req.headers.has("authorization")) {
    return NextResponse.json({ error: "Sign in to view your profile" }, { status: 401 });
  }
  const user = await getVerifiedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Your session is invalid. Please sign in again." }, { status: 401 });
  }

  try {
    const [reward, visitHistory] = await Promise.all([
      getCustomerVisitRewards(user.id),
      getCustomerVisitHistory(user.id),
    ]);
    return NextResponse.json({
      name:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : user.email?.split("@")[0] ?? "Client",
      email: user.email ?? null,
      ...buildCustomerProfileData(user.id, db.appointments, db.services, reward, visitHistory),
    });
  } catch {
    console.error("Could not load customer profile");
    return NextResponse.json({ error: "Your profile is temporarily unavailable" }, { status: 503 });
  }
}
