import { NextResponse } from "next/server";

const supabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
const anonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const adminIds = () => (process.env.ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export const authConfigured = () => !!supabaseUrl() && !!anonKey() && adminIds().length > 0;

/**
 * Verifies the bearer token with Supabase Auth, then checks the verified user id against the
 * server-side ADMIN_USER_IDS allowlist. Nothing the browser sends is trusted as an identity claim.
 */
export async function getAdminId(req: Request): Promise<string | null> {
  if (!authConfigured()) return null;
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return null;
  try {
    const res = await fetch(`${supabaseUrl()}/auth/v1/user`, { headers: { apikey: anonKey(), Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const user = (await res.json()) as { id?: unknown };
    return typeof user.id === "string" && adminIds().includes(user.id) ? user.id : null;
  } catch {
    return null;
  }
}

/** Returns an error response when the caller is not an administrator, otherwise null. Fails closed. */
export async function denyUnlessAdmin(req: Request): Promise<NextResponse | null> {
  if (!authConfigured()) return NextResponse.json({ error: "Admin authentication is not configured" }, { status: 503 });
  return (await getAdminId(req)) ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
