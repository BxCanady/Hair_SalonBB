export const inputCls = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 placeholder:text-gray-500 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-200";
export const btn = "rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50";
export const btnPrimary = `${btn} bg-violet-600 text-white hover:bg-violet-700`;
export const btnGhost = `${btn} border border-gray-300 bg-white text-gray-800 hover:bg-gray-50`;
export const btnDanger = `${btn} border border-red-300 text-red-700 hover:bg-red-50`;
export const cardCls = "rounded-2xl border border-gray-200 bg-white p-4 text-gray-950 shadow-sm";
export { default as Button } from "./Button";
export { default as MobileNav } from "./MobileNav";

import { authHeaders } from "@/lib/adminClient";

export async function api(path: string, method: string, body?: unknown): Promise<string | null> {
  try {
    const res = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.ok) return null;
    return (await res.json().catch(() => ({}))).error ?? "Request failed";
  } catch {
    return "Network error";
  }
}