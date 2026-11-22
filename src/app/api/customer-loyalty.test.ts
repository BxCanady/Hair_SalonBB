import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loyaltyMocks = vi.hoisted(() => ({
  getCustomerVisitRewards: vi.fn(),
  redeemVisitReward: vi.fn(),
  recordCompletedVisit: vi.fn(),
  refundVisitReward: vi.fn(),
}));

vi.mock("@/lib/loyaltyDb", () => loyaltyMocks);

import * as appointments from "@/app/api/appointments/route";
import * as appointment from "@/app/api/appointments/[id]/route";
import * as loyalty from "@/app/api/customer/loyalty/route";
import { db } from "@/lib/db";

const ADMIN = "admin-id";
const CUSTOMER = "customer-id";

const request = (url: string, init?: RequestInit & { token?: string }) => new Request(`http://test${url}`, {
  ...init,
  headers: {
    "Content-Type": "application/json",
    ...(init?.token ? { Authorization: `Bearer ${init.token}` } : {}),
    ...init?.headers,
  },
});

function futureMonday() {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() + 2);
  while (date.getUTCDay() !== 1) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
  vi.stubEnv("ADMIN_USER_IDS", ADMIN);
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
    const authorization = (init.headers as Record<string, string>).Authorization;
    if (authorization === "Bearer admin-token") return Response.json({ id: ADMIN });
    if (authorization === "Bearer customer-token") return Response.json({ id: CUSTOMER, email: "customer@example.com" });
    return new Response("{}", { status: 401 });
  }));
  loyaltyMocks.getCustomerVisitRewards.mockResolvedValue({
    completedVisits: 5,
    rewardsAvailable: 1,
    visitsUntilReward: 5,
    rewardValueCents: 1000,
  });
  loyaltyMocks.redeemVisitReward.mockResolvedValue(true);
  loyaltyMocks.recordCompletedVisit.mockResolvedValue(undefined);
  loyaltyMocks.refundVisitReward.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("customer visit rewards", () => {
  it("returns progress only for a verified signed-in customer", async () => {
    expect((await loyalty.GET(request("/api/customer/loyalty"))).status).toBe(401);
    const res = await loyalty.GET(request("/api/customer/loyalty", { token: "customer-token" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ completedVisits: 5, rewardsAvailable: 1, rewardValueCents: 1000 });
    expect(loyaltyMocks.getCustomerVisitRewards).toHaveBeenCalledWith(CUSTOMER);
  });

  it("does not allow a guest to claim an account reward", async () => {
    const res = await appointments.POST(request("/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        serviceId: "svc-cut",
        date: futureMonday(),
        time: "14:00",
        customerName: "Guest",
        customerEmail: "guest@example.com",
        customerPhone: "555-123-4567",
        applyVisitReward: true,
      }),
    }));
    expect(res.status).toBe(401);
    expect(loyaltyMocks.redeemVisitReward).not.toHaveBeenCalled();
  });

  it("applies an approved reward and records a completed authenticated visit once", async () => {
    const date = futureMonday();
    const created = await appointments.POST(request("/api/appointments", {
      method: "POST",
      token: "customer-token",
      headers: { "x-forwarded-for": "10.1.0.1" },
      body: JSON.stringify({
        serviceId: "svc-cut",
        date,
        time: "14:00",
        customerName: "Customer",
        customerEmail: "customer@example.com",
        customerPhone: "555-123-4567",
        applyVisitReward: true,
      }),
    }));
    expect(created.status).toBe(201);
    const booked = await created.json() as { id: string; customerUserId: string; discountCents: number };
    expect(booked).toMatchObject({ customerUserId: CUSTOMER, discountCents: 1000 });
    expect(loyaltyMocks.redeemVisitReward).toHaveBeenCalledWith(CUSTOMER, booked.id);

    const completed = await appointment.PATCH(
      request(`/api/appointments/${booked.id}`, { method: "PATCH", token: "admin-token", body: JSON.stringify({ status: "completed" }) }),
      { params: Promise.resolve({ id: booked.id }) },
    );
    expect(completed.status).toBe(200);
    expect((await completed.json()).status).toBe("completed");
    expect(loyaltyMocks.recordCompletedVisit).toHaveBeenCalledWith(CUSTOMER, booked.id);
  });

  it("does not place a reward booking when Postgres has no reward to redeem", async () => {
    loyaltyMocks.redeemVisitReward.mockResolvedValue(false);
    const before = db.appointments.length;
    const res = await appointments.POST(request("/api/appointments", {
      method: "POST",
      token: "customer-token",
      headers: { "x-forwarded-for": "10.1.0.2" },
      body: JSON.stringify({
        serviceId: "svc-cut",
        date: futureMonday(),
        time: "15:00",
        customerName: "Customer",
        customerEmail: "customer@example.com",
        customerPhone: "555-123-4567",
        applyVisitReward: true,
      }),
    }));
    expect(res.status).toBe(409);
    expect(db.appointments).toHaveLength(before);
  });
});
