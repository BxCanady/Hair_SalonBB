import type { Appointment, Service } from "./types";
import type { VisitRewardProgress } from "./loyalty";

export type CustomerVisitHistory = {
  appointmentId: string;
  completedAt: string;
};

export type CustomerProfileAppointment = {
  id: string;
  date: string;
  time: string;
  status: Appointment["status"];
  serviceId: string;
  serviceName: string;
  durationMin: number;
  priceCents: number;
  discountCents: number;
};

export type CustomerProfileData = {
  appointments: CustomerProfileAppointment[];
  reward: VisitRewardProgress;
  visitHistory: Array<CustomerVisitHistory & {
    serviceName: string | null;
  }>;
};

export function buildCustomerProfileData(
  userId: string,
  appointments: Appointment[],
  services: Service[],
  reward: VisitRewardProgress,
  visitHistory: CustomerVisitHistory[],
): CustomerProfileData {
  const serviceById = new Map(services.map((service) => [service.id, service]));
  const profileAppointments = appointments
    .filter((appointment) => appointment.customerUserId === userId)
    .map((appointment) => {
      const service = serviceById.get(appointment.serviceId);
      return {
        id: appointment.id,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
        serviceId: appointment.serviceId,
        serviceName: service?.name ?? "Hair appointment",
        durationMin: service?.durationMin ?? 0,
        priceCents: service?.priceCents ?? 0,
        discountCents: appointment.discountCents ?? 0,
      };
    })
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));

  const appointmentById = new Map(profileAppointments.map((appointment) => [appointment.id, appointment]));
  return {
    appointments: profileAppointments,
    reward,
    visitHistory: visitHistory.map((visit) => ({
      ...visit,
      serviceName: appointmentById.get(visit.appointmentId)?.serviceName ?? null,
    })),
  };
}
