"use client";
import { useEffect, useMemo, useState } from "react";
import MonthGrid from "./MonthGrid";
import Button from "./ui/Button";
import { addDays, fmt12, fmtDate, money } from "@/lib/time";
import type { Appointment, Service, Slot, Staff } from "@/lib/types";

const input = "w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-200";
const card = "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm";

export default function BookingFlow() {
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loadError, setLoadError] = useState("");
  const [serviceId, setServiceId] = useState("");
  const today = fmtDate(new Date());
  const [month, setMonth] = useState(today);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [form, setForm] = useState({ customerName: "", customerEmail: "", customerPhone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [done, setDone] = useState<Appointment | null>(null);

  useEffect(() => {
    Promise.all(["services", "staff"].map((p) => fetch(`/api/${p}`).then((r) => { if (!r.ok) throw new Error(); return r.json(); })))
      .then(([sv, st]) => {
        setServices(sv);
        setStaff(st);
      })
      .catch(() => setLoadError("Could not load salon data. Please check your connection."));
  }, []);

  const service = services.find((s) => s.id === serviceId);
  const categories = useMemo(() => [...new Set(services.map((s) => s.category))], [services]);

  const slotsKey = `${serviceId}|${date}|${refresh}`;
  const [loaded, setLoaded] = useState({ key: "", slots: [] as Slot[] });
  const slotsLoading = !!serviceId && !!date && loaded.key !== slotsKey;
  const slots = loaded.key === slotsKey ? loaded.slots : [];

  useEffect(() => {
    if (!serviceId || !date) return;
    let cancelled = false;
    fetch(`/api/availability?serviceId=${serviceId}&date=${date}`)
      .then((r) => r.json())
      .catch(() => [])
      .then((s) => !cancelled && setLoaded({ key: slotsKey, slots: Array.isArray(s) ? s : [] }));
    return () => {
      cancelled = true;
    };
  }, [serviceId, date, refresh, slotsKey]);

  const chooseService = (id: string) => {
    setServiceId(id);
    setDate("");
    setTime("");
  };

  const shiftMonth = (n: number) => {
    const d = new Date(`${month.slice(0, 7)}-01T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + n);
    setMonth(d.toISOString().slice(0, 10));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, date, time, ...form }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Booking failed");
        if (res.status === 409) {
          setTime("");
          setRefresh((n) => n + 1);
        }
        return;
      }
      setDone(body);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    const st = staff.find((s) => s.id === done.staffId);
    const sv = services.find((s) => s.id === done.serviceId);
    return (
      <section aria-live="polite" className={`${card} mx-auto max-w-md text-center`}>
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">✓</div>
        <h2 className="text-xl font-semibold">You&apos;re booked!</h2>
        <p className="mt-1 text-sm text-gray-600">Confirmation #{done.id}. A confirmation will be sent to {done.customerEmail}.</p>
        <dl className="mt-4 space-y-1 text-left text-sm">
          <Row k="Service" v={`${sv?.name} (${sv?.durationMin} min, ${money(sv?.priceCents ?? 0)})`} />
          <Row k="Stylist" v={st?.name ?? ""} />
          <Row k="Date" v={done.date} />
          <Row k="Time" v={fmt12(done.time)} />
          <Row k="Status" v="Pending salon confirmation" />
        </dl>
        <Button className="mt-5" onClick={() => location.reload()}>
          Book another appointment
        </Button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {loadError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{loadError}</p>}

      <section aria-labelledby="h-service">
        <h2 id="h-service" className="mb-2 text-lg font-semibold">1. Choose a service</h2>
        {categories.map((c) => (
          <div key={c} className="mb-3">
            <h3 className="mb-1 text-sm font-medium text-gray-500">{c}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {services.filter((s) => s.category === c).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={serviceId === s.id}
                  onClick={() => chooseService(s.id)}
                  className={`${card} text-left transition hover:border-violet-400 ${serviceId === s.id ? "border-violet-600 ring-2 ring-violet-200" : ""}`}
                >
                  <div className="flex justify-between font-medium"><span>{s.name}</span><span>{money(s.priceCents)}</span></div>
                  <div className="text-sm text-gray-500">{s.durationMin} min · {s.description}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      {service && (
        <section aria-labelledby="h-date">
          <h2 id="h-date" className="mb-2 text-lg font-semibold">2. Pick a date &amp; time</h2>
          {staff[0] && <p className="mb-2 text-sm text-gray-500">Appointments are with {staff[0].name}, the salon owner.</p>}
          <div className={card}>
            <div className="mb-2 flex items-center justify-between">
              <button type="button" aria-label="Previous month" disabled={month.slice(0, 7) <= today.slice(0, 7)} onClick={() => shiftMonth(-1)} className="rounded px-3 py-1 hover:bg-gray-100 disabled:opacity-30">‹</button>
              <span className="font-medium">{new Date(`${month.slice(0, 7)}-01T00:00:00Z`).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}</span>
              <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)} className="rounded px-3 py-1 hover:bg-gray-100">›</button>
            </div>
            <MonthGrid month={month} selected={date} disabled={(d) => d < today || d > addDays(today, 180)} onSelect={(d) => { setDate(d); setTime(""); }} />
          </div>
          {date && (
            <div className="mt-3" aria-live="polite">
              <h3 className="mb-1 text-sm font-medium text-gray-500">Available times on {date}</h3>
              {slotsLoading ? (
                <p className="text-sm text-gray-500">Loading…</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-gray-500">No availability on this day. Try another date.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((s) => (
                    <button key={s.time} type="button" aria-pressed={time === s.time} onClick={() => setTime(s.time)}
                      className={`rounded-lg border px-2 py-2 text-sm ${time === s.time ? "border-violet-600 bg-violet-600 text-white" : "border-gray-300 bg-white hover:border-violet-400"}`}>
                      {fmt12(s.time)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {service && date && time && (
        <section aria-labelledby="h-details">
          <h2 id="h-details" className="mb-2 text-lg font-semibold">3. Your details</h2>
          <form onSubmit={submit} className={`${card} space-y-3`}>
            <p className="text-sm text-gray-600">{service.name} · {date} at {fmt12(time)} · {money(service.priceCents)}</p>
            <label className="block text-sm font-medium">Name
              <input className={input} required autoComplete="name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            </label>
            <label className="block text-sm font-medium">Email
              <input className={input} type="email" required autoComplete="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} />
            </label>
            <label className="block text-sm font-medium">Phone
              <input className={input} type="tel" required autoComplete="tel" pattern="[\d\s()+.\-]{7,}" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
            </label>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Booking…" : "Confirm booking"}
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-1">
      <dt className="text-gray-500">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
