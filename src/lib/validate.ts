import type { Service, Staff, WorkingHours } from "./types";
import { isValidTime } from "./time";

type Obj = Record<string, unknown>;
const str = (v: unknown, max = 200) => (typeof v === "string" && v.trim() && v.length <= max ? v.trim() : null);

export function parseService(b: Obj): Omit<Service, "id"> | null {
  const name = str(b.name, 100);
  const category = str(b.category, 50);
  const description = typeof b.description === "string" ? b.description.slice(0, 500) : "";
  const durationMin = Number(b.durationMin);
  const priceCents = Number(b.priceCents);
  if (!name || !category || !Number.isInteger(durationMin) || durationMin < 15 || durationMin > 600) return null;
  if (!Number.isInteger(priceCents) || priceCents < 0) return null;
  return { name, category, description, durationMin, priceCents };
}

function parseHours(v: unknown): WorkingHours | null {
  if (!Array.isArray(v) || v.length !== 7) return null;
  const out: WorkingHours = [];
  for (const d of v) {
    if (d === null) { out.push(null); continue; }
    const o = d as Obj;
    if (!o || typeof o.start !== "string" || typeof o.end !== "string") return null;
    if (!isValidTime(o.start) || !isValidTime(o.end) || o.start >= o.end) return null;
    out.push({ start: o.start, end: o.end });
  }
  return out;
}

export function parseStaff(b: Obj): Omit<Staff, "id"> | null {
  const name = str(b.name, 100);
  const role = str(b.role, 100);
  const email = str(b.email, 200);
  const workingHours = parseHours(b.workingHours);
  if (!name || !role || !email || !/^\S+@\S+\.\S+$/.test(email) || !workingHours) return null;
  if (!Array.isArray(b.serviceIds) || !b.serviceIds.every((s) => typeof s === "string")) return null;
  return { name, role, email, workingHours, serviceIds: b.serviceIds as string[] };
}

export function parseCustomer(b: Obj) {
  const customerName = str(b.customerName, 100);
  const customerEmail = str(b.customerEmail, 200);
  const customerPhone = str(b.customerPhone, 30);
  if (!customerName || !customerEmail || !/^\S+@\S+\.\S+$/.test(customerEmail)) return null;
  if (!customerPhone || !/^[\d\s()+.-]{7,}$/.test(customerPhone)) return null;
  return { customerName, customerEmail, customerPhone };
}

export async function readJson(req: Request): Promise<Obj | null> {
  try {
    const b = await req.json();
    return b && typeof b === "object" && !Array.isArray(b) ? (b as Obj) : null;
  } catch {
    return null;
  }
}
