import { describe, expect, it } from "vitest";
import { buildCustomerProfileData } from "./customerProfile";
import type { Appointment, Service } from "./types";

const services: Service[] = [{
  id: "svc-braids",
  name: "Knotless Braids",
  category: "Styling",
  description: "",
  durationMin: 240,
  priceCents: 20000,
}];

const appointment = {
  id: "apt-1",
  serviceId: "svc-braids",
  staffId: "staff-1",
  date: "2026-11-20",
  time: "10:00",
  customerName: "Client",
  customerEmail: "client@example.com",
  customerPhone: "555-0100",
  customerUserId: "user-1",
  discountCents: 1000,
  status: "completed",
  createdAt: "2026-11-01T00:00:00.000Z",
} satisfies Appointment;

describe("customer profile data", () => {
  it("returns only the verified customer's appointments with service details", () => {
    const profile = buildCustomerProfileData(
      "user-1",
      [appointment, { ...appointment, id: "apt-other", customerUserId: "user-2" }],
      services,
      { completedVisits: 1, rewardsAvailable: 0, visitsUntilReward: 4, rewardValueCents: 1000 },
      [{ appointmentId: "apt-1", completedAt: "2026-11-20T18:00:00.000Z" }],
    );

    expect(profile.appointments).toHaveLength(1);
    expect(profile.appointments[0]).toMatchObject({
      id: "apt-1",
      serviceName: "Knotless Braids",
      durationMin: 240,
      priceCents: 20000,
      discountCents: 1000,
    });
    expect(profile.visitHistory[0]).toMatchObject({
      appointmentId: "apt-1",
      serviceName: "Knotless Braids",
    });
  });

  it("keeps persisted visit history when runtime appointment details expired", () => {
    const profile = buildCustomerProfileData(
      "user-1",
      [],
      services,
      { completedVisits: 1, rewardsAvailable: 0, visitsUntilReward: 4, rewardValueCents: 1000 },
      [{ appointmentId: "missing", completedAt: "2026-10-10T18:00:00.000Z" }],
    );

    expect(profile.visitHistory).toEqual([{
      appointmentId: "missing",
      completedAt: "2026-10-10T18:00:00.000Z",
      serviceName: null,
    }]);
  });
});
