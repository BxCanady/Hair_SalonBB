import { normalizeSupabaseUrl } from "./supabaseUrl";

const TOKEN_KEY = "salon-admin-token";
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export const subscribeToken = (cb: () => void) => {
  listeners.add(cb);
  return () => void listeners.delete(cb);
};
export const getToken = () => (typeof window === "undefined" ? null : window.sessionStorage.getItem(TOKEN_KEY));
export const clearToken = () => {
  window.sessionStorage.removeItem(TOKEN_KEY);
  notify();
};

export const authHeaders = (): Record<string, string> => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

/** Signs in with Supabase Auth (password grant). Returns an error message, or null on success. */
export async function signIn(email: string, password: string): Promise<string | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !anon) return "Admin sign-in is not configured";
  try {
    const res = await fetch(`${normalizeSupabaseUrl(base)}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anon },
      body: JSON.stringify({ email, password }),
    });
    const body = (await res.json().catch(() => ({}))) as { access_token?: string };
    if (!res.ok || !body.access_token) return "Invalid email or password";
    window.sessionStorage.setItem(TOKEN_KEY, body.access_token);
    notify();
    return null;
  } catch {
    return "Network error";
  }
}
