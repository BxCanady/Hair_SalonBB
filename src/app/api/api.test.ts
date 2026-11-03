import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import * as hairstyles from "@/app/api/hairstyles/route";
import * as hairstyle from "@/app/api/hairstyles/[id]/route";
import * as uploads from "@/app/api/uploads/route";
import * as appointments from "@/app/api/appointments/route";
import * as services from "@/app/api/services/route";

const ADMIN = "admin-user-id";
const json = (url: string, init?: RequestInit & { token?: string }) =>
  new Request(`http://test${url}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.token ? { Authorization: `Bearer ${init.token}` } : {}), ...init?.headers },
  });
const body = { title: "Test style", description: "", imageUrl: "/images/hero.png", serviceId: "svc-style", priceCents: 9000, durationMin: 120, isPublished: true };

function stubAuth() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
  vi.stubEnv("ADMIN_USER_IDS", ADMIN);
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
    const auth = (init.headers as Record<string, string>).Authorization;
    if (auth === "Bearer admin-token") return Response.json({ id: ADMIN });
    if (auth === "Bearer customer-token") return Response.json({ id: "someone-else" });
    return new Response("{}", { status: 401 });
  }));
}

beforeEach(() => stubAuth());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("hairstyle visibility", () => {
  it("public list only returns published hairstyles", async () => {
    const draft = { ...db.hairstyles[0], id: "hs-draft", isPublished: false };
    db.hairstyles.push(draft);
    const list = (await (await hairstyles.GET(json("/api/hairstyles"))).json()) as { id: string }[];
    expect(list.length).toBeGreaterThan(0);
    expect(list.some((h) => h.id === "hs-draft")).toBe(false);
    db.hairstyles.splice(db.hairstyles.indexOf(draft), 1);
  });

  it("unpublished hairstyles are hidden from the public but visible to admins", async () => {
    const draft = { ...db.hairstyles[0], id: "hs-draft2", isPublished: false };
    db.hairstyles.push(draft);
    const ctx = { params: Promise.resolve({ id: "hs-draft2" }) };
    expect((await hairstyle.GET(json("/api/hairstyles/hs-draft2"), ctx)).status).toBe(404);
    expect((await hairstyle.GET(json("/api/hairstyles/hs-draft2", { token: "admin-token" }), ctx)).status).toBe(200);
    db.hairstyles.splice(db.hairstyles.indexOf(draft), 1);
  });

  it("?all=1 requires an administrator", async () => {
    expect((await hairstyles.GET(json("/api/hairstyles?all=1"))).status).toBe(401);
    expect((await hairstyles.GET(json("/api/hairstyles?all=1", { token: "customer-token" }))).status).toBe(401);
    expect((await hairstyles.GET(json("/api/hairstyles?all=1", { token: "admin-token" }))).status).toBe(200);
  });
});

describe("admin-only modifications", () => {
  it("rejects anonymous and non-admin writes", async () => {
    for (const token of [undefined, "customer-token", "bogus"]) {
      expect((await hairstyles.POST(json("/api/hairstyles", { method: "POST", body: JSON.stringify(body), token }))).status).toBe(401);
      const ctx = { params: Promise.resolve({ id: db.hairstyles[0].id }) };
      expect((await hairstyle.PATCH(json("/x", { method: "PATCH", body: "{}", token }), ctx)).status).toBe(401);
      expect((await hairstyle.DELETE(json("/x", { method: "DELETE", token }), ctx)).status).toBe(401);
      expect((await services.POST(json("/api/services", { method: "POST", body: "{}", token }))).status).toBe(401);
      expect((await appointments.GET(json("/api/appointments", { token }))).status).toBe(401);
    }
  });

  it("does not trust an admin flag supplied by the browser", async () => {
    const res = await hairstyles.POST(json("/api/hairstyles", { method: "POST", body: JSON.stringify({ ...body, isAdmin: true, userId: ADMIN }), headers: { "x-user-id": ADMIN } }));
    expect(res.status).toBe(401);
  });

  it("fails closed when auth is not configured", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("ADMIN_USER_IDS", "");
    expect((await hairstyles.POST(json("/api/hairstyles", { method: "POST", body: JSON.stringify(body), token: "admin-token" }))).status).toBe(503);
  });

  it("lets an administrator create, update, unpublish and delete", async () => {
    const created = await hairstyles.POST(json("/api/hairstyles", { method: "POST", body: JSON.stringify(body), token: "admin-token" }));
    expect(created.status).toBe(201);
    const h = (await created.json()) as { id: string; sortOrder: number };
    const ctx = { params: Promise.resolve({ id: h.id }) };
    const patched = await hairstyle.PATCH(json("/x", { method: "PATCH", body: JSON.stringify({ isPublished: false, priceCents: 10000 }), token: "admin-token" }), ctx);
    expect(await patched.json()).toMatchObject({ isPublished: false, priceCents: 10000, title: "Test style" });
    expect((await hairstyle.DELETE(json("/x", { method: "DELETE", token: "admin-token" }), ctx)).status).toBe(200);
  });

  it("validates input on the server", async () => {
    const bad = await hairstyles.POST(json("/api/hairstyles", { method: "POST", body: JSON.stringify({ ...body, imageUrl: "https://evil.example/x.png" }), token: "admin-token" }));
    expect(bad.status).toBe(400);
    const unknownService = await hairstyles.POST(json("/api/hairstyles", { method: "POST", body: JSON.stringify({ ...body, serviceId: "nope" }), token: "admin-token" }));
    expect(unknownService.status).toBe(400);
  });
});

describe("photo uploads", () => {
  const form = (bytes: number[], type: string) => {
    const fd = new FormData();
    fd.append("file", new File([Uint8Array.from(bytes)], "a.png", { type }));
    return fd;
  };

  it("rejects unauthorized uploads", async () => {
    const res = await uploads.POST(new Request("http://test/api/uploads", { method: "POST", body: form([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4, 5, 6, 7, 8], "image/png") }));
    expect(res.status).toBe(401);
  });

  it("rejects non-images from administrators", async () => {
    const res = await uploads.POST(new Request("http://test/api/uploads", { method: "POST", headers: { Authorization: "Bearer admin-token" }, body: form([1, 2, 3, 4], "image/png") }));
    expect(res.status).toBe(400);
  });
});

describe("booking", () => {
  const nextMonday = () => {
    const d = new Date();
    d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7) + 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const book = (n: number, over: Record<string, unknown> = {}) =>
    appointments.POST(json("/api/appointments", {
      method: "POST",
      headers: { "x-forwarded-for": `10.0.0.${n}` },
      body: JSON.stringify({ serviceId: "svc-cut", date: nextMonday(), time: "10:00", customerName: "A", customerEmail: "a@b.co", customerPhone: "555-123-4567", ...over }),
    }));

  it("lets only one of two simultaneous requests take the same slot", async () => {
    const results = await Promise.all([book(1), book(2)]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
  });

  it("rejects invalid service ids and dates", async () => {
    expect((await book(3, { serviceId: "nope" })).status).toBe(400);
    expect((await book(4, { date: "2020-13-45" })).status).toBe(400);
    expect((await book(5, { date: "2020-01-06" })).status).toBe(409);
  });

  it("rate limits repeated requests from one client", async () => {
    const statuses = [];
    for (let i = 0; i < 12; i++) statuses.push((await book(99, { serviceId: "nope" })).status);
    expect(statuses.at(-1)).toBe(429);
  });
});
