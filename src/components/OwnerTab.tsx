"use client";
import { useState } from "react";
import { api, Button } from "./ui";
import type { Service, Staff } from "@/lib/types";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const field =
  "mt-1.5 w-full min-h-11 rounded-xl border border-white/15 bg-black/35 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function OwnerTab({ owner, services, reload }: { owner: Staff | null; services: Service[]; reload: () => Promise<void> }) {
  if (!owner) return <p role="alert" className="text-sm text-red-600">Owner profile is unavailable.</p>;
  const key = `${owner.id}:${JSON.stringify(owner.workingHours)}:${owner.serviceIds.join(",")}:${owner.name}:${owner.role}:${owner.email}`;
  return <OwnerForm key={key} owner={owner} services={services} reload={reload} />;
}

function OwnerForm({ owner, services, reload }: { owner: Staff; services: Service[]; reload: () => Promise<void> }) {
  const [form, setForm] = useState(() => ({
    name: owner.name,
    role: owner.role,
    email: owner.email,
    serviceIds: [...owner.serviceIds],
    workingHours: owner.workingHours.map((hours) => (hours ? { ...hours } : null)),
  }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const setDay = (index: number, hours: { start: string; end: string } | null) =>
    setForm((current) => ({
      ...current,
      workingHours: current.workingHours.map((currentHours, day) => (day === index ? hours : currentHours)),
    }));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const message = await api(`/api/staff/${owner.id}`, "PUT", form);
    if (message) setError(message);
    else await reload();
    setSaving(false);
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-secondary to-primary p-px">
        <div className="rounded-[15px] bg-[#13091f] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Salon administration</p>
          <h2 className="mt-1 text-xl font-bold text-white">Owner profile</h2>
          <p className="mt-1 text-sm leading-5 text-white/65">Keep customer-facing contact details and available service hours current.</p>
        </div>
      </div>
      <form onSubmit={save} className="space-y-6 rounded-2xl border border-white/10 bg-[#171017] p-4 shadow-xl sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-white">
            Name
            <input required className={field} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="block text-sm font-semibold text-white">
            Role
            <input required className={field} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} />
          </label>
          <label className="block text-sm font-semibold text-white md:col-span-2">
            Contact email
            <input type="email" required className={field} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
        </div>
        <fieldset className="border-t border-white/10 pt-5">
          <legend className="px-0 text-base font-bold text-white">Services offered</legend>
          <p className="mt-1 text-sm text-white/55">Select every service this stylist can perform.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {services.map((service) => (
              <label
                key={service.id}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                  form.serviceIds.includes(service.id)
                    ? "border-primary/70 bg-primary/15 text-white"
                    : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/25"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#e546d8]"
                  checked={form.serviceIds.includes(service.id)}
                  onChange={(event) => setForm({
                    ...form,
                    serviceIds: event.target.checked
                      ? [...form.serviceIds, service.id]
                      : form.serviceIds.filter((id) => id !== service.id),
                  })}
                />
                {service.name}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="border-t border-white/10 pt-5">
          <legend className="px-0 text-base font-bold text-white">Working hours</legend>
          <p className="mt-1 text-sm text-white/55">Turn a day off or set its appointment window.</p>
          <div className="mt-3 space-y-2">
            {DAYS.map((day, index) => {
              const hours = form.workingHours[index];
              return (
                <div
                  key={day}
                  className={`rounded-xl border p-3 transition ${
                    hours ? "border-white/10 bg-black/25" : "border-white/5 bg-white/[0.025]"
                  }`}
                >
                  <label className="flex min-h-9 cursor-pointer items-center justify-between gap-3">
                    <span className="flex items-center gap-3 font-semibold text-white">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#e546d8]"
                        checked={!!hours}
                        onChange={(event) => setDay(index, event.target.checked ? { start: "09:00", end: "17:00" } : null)}
                      />
                      {day}
                    </span>
                    <span className={`text-xs font-semibold ${hours ? "text-green-300" : "text-white/35"}`}>
                      {hours ? "Available" : "Off"}
                    </span>
                  </label>
                  {hours ? (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <label className="text-xs font-medium text-white/60">
                        Opens
                        <input
                          aria-label={`${day} start`}
                          type="time"
                          required
                          className={`${field} [color-scheme:dark]`}
                          value={hours.start}
                          onChange={(event) => setDay(index, { ...hours, start: event.target.value })}
                        />
                      </label>
                      <label className="text-xs font-medium text-white/60">
                        Closes
                        <input
                          aria-label={`${day} end`}
                          type="time"
                          required
                          className={`${field} [color-scheme:dark]`}
                          value={hours.end}
                          onChange={(event) => setDay(index, { ...hours, end: event.target.value })}
                        />
                      </label>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </fieldset>
        {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}
        <Button type="submit" disabled={saving} className="min-h-11 w-full sm:w-auto">
          {saving ? "Saving…" : "Save owner profile"}
        </Button>
      </form>
    </section>
  );
}