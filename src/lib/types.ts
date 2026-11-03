export type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  durationMin: number;
  priceCents: number;
};

export type DayHours = { start: string; end: string } | null;
// Index 0 = Sunday ... 6 = Saturday
export type WorkingHours = DayHours[];

export type Staff = {
  id: string;
  name: string;
  role: string;
  email: string;
  serviceIds: string[];
  workingHours: WorkingHours;
};

export type AppointmentStatus = "pending" | "confirmed" | "cancelled";

export type Appointment = {
  id: string;
  serviceId: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: AppointmentStatus;
  createdAt: string;
};

export type Hairstyle = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  serviceId: string | null;
  priceCents: number;
  durationMin: number;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type HairstyleInput = Omit<Hairstyle, "id" | "createdAt" | "updatedAt">;

export type Slot = { time: string; staffId: string };
