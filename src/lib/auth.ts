import { NextResponse } from "next/server";
import { normalizeSupabaseUrl } from "./supabaseUrl";

const supabaseUrl = () => normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const anonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const adminIds = () => (process.env.ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export const supabaseAuthConfigured = () => !!supabaseUrl() && !!anonKey();
export const authConfigured = () => supabaseAuthConfigured() && adminIds().length > 0;

export type VerifiedUser = { id: string; email?: string; user_metadata?: Record<string, unknown> };

/**
 * Verifies a bearer token with Supabase Auth. The returned identity comes only from Supabase,
 * never from browser-supplied user IDs or metadata.
 */
export async function getVerifiedUser(req: Request): Promise<VerifiedUser | null> {
  if (!supabaseAuthConfigured()) return null;
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return null;
  try {
    const res = await fetch(`${supabaseUrl()}/auth/v1/user`, { headers: { apikey: anonKey(), Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const user = (await res.json()) as { id?: unknown; email?: unknown; user_metadata?: unknown };
    if (typeof user.id !== "string") return null;
    return {
      id: user.id,
      ...(typeof user.email === "string" ? { email: user.email } : {}),
      ...(user.user_metadata && typeof user.user_metadata === "object" ? { user_metadata: user.user_metadata as Record<string, unknown> } : {}),
    };
  } catch {
    return null;
  }
}

/** Verifies identity with Supabase before checking the server-side administrator allowlist. */
export async function getAdminId(req: Request): Promise<string | null> {
  if (!authConfigured()) return null;
  const user = await getVerifiedUser(req);
  return user && adminIds().includes(user.id) ? user.id : null;
}

/** Returns an error response when the caller is not an administrator, otherwise null. Fails closed. */
export async function denyUnlessAdmin(req: Request): Promise<NextResponse | null> {
  if (!authConfigured()) return NextResponse.json({ error: "Admin authentication is not configured" }, { status: 503 });
  return (await getAdminId(req)) ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
