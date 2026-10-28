"use client";
import { useEffect, useState } from "react";
import { api, Button, cardCls, inputCls } from "./ui";
import type { Service, Staff, WorkingHours } from "@/lib/types";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const defaultHours = (): WorkingHours => DAYS.map((_, i) => (i === 0 ? null : { start: "09:00", end: "17:00" }));
const blank = { name: "", role: "Owner & Stylist", email: "", serviceIds: [] as string[], workingHours: defaultHours() };

export default function OwnerTab({ owner, services, reload }: { owner: Staff | null; services: Service[]; reload: () => Promise<void> }) {
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (owner) {
      setForm({
        name: owner.name,
        role: owner.role,
        email: owner.email,
        serviceIds: owner.serviceIds,
        workingHours: owner.workingHours.map((hours) => (hours ? { ...hours } : null)),
      });
    }
  }, [owner]);

  const setDay = (index: number, hours: { start: string; end: string } | null) =>
    setForm({ ...form, workingHours: form.workingHours.map((current, day) => (day === index ? hours : current)) });

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!owner) return;
    setSaving(true);
    setError("");
    const message = await api(`/api/staff/${owner.id}`, "PUT", form);
    if (message) setError(message);
    else await reload();
    setSaving(false);
  }

  if (!owner) return <p role="alert" className="text-sm text-red-600">Owner profile is unavailable.</p>;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Owner profile</h2>
      <form onSubmit={save} className={`${cardCls} space-y-3`}>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">Name<input required className={inputCls} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label className="text-sm">Role<input required className={inputCls} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} /></label>
          <label className="text-sm">Email<input type="email" required className={inputCls} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        </div>
        <fieldset>
          <legend className="text-sm font-medium">Services offered</legend>
          <div className="mt-1 flex flex-wrap gap-3">
            {services.map((service) => (
              <label key={service.id} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
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
        <fieldset>
          <legend className="text-sm font-medium">Working hours</legend>
          <div className="mt-1 space-y-1">
            {DAYS.map((day, index) => {
              const hours = form.workingHours[index];
              return (
                <div key={day} className="flex items-center gap-2 text-sm">
                  <label className="flex w-20 items-center gap-1">
                    <input type="checkbox" checked={!!hours} onChange={(event) => setDay(index, event.target.checked ? { start: "09:00", end: "17:00" } : null)} />
                    {day}
                  </label>
                  {hours ? (
                    <>
                      <input aria-label={`${day} start`} type="time" required className={`${inputCls} w-32`} value={hours.start} onChange={(event) => setDay(index, { ...hours, start: event.target.value })} />
                      <span>to</span>
                      <input aria-label={`${day} end`} type="time" required className={`${inputCls} w-32`} value={hours.end} onChange={(event) => setDay(index, { ...hours, end: event.target.value })} />
                    </>
                  ) : <span className="text-gray-400">Off</span>}
                </div>
              );
            })}
          </div>
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save owner profile"}</Button>
      </form>
    </section>
  );
}