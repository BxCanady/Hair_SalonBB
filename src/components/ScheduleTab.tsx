"use client";
import { useState } from "react";
import MonthGrid from "./MonthGrid";
import { api, btnDanger, btnGhost, btnPrimary, cardCls, inputCls } from "./ui";
import { addDays, fmt12, fmtDate, toMinutes, toTime, money } from "@/lib/time";
import type { Appointment, Service, Staff } from "@/lib/types";

type View = "day" | "week" | "month";
const badgeCls: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-200 text-gray-600",
};

export default function ScheduleTab({ services, staff, appointments, reload }: { services: Service[]; staff: Staff[]; appointments: Appointment[]; reload: () => Promise<void> }) {
  const [view, setView] = useState<View>("day");
  const [date, setDate] = useState(fmtDate(new Date()));
  const [staffFilter, setStaffFilter] = useState("all");
  const [msg, setMsg] = useState("");

  const visible = appointments.filter((a) => staffFilter === "all" || a.staffId === staffFilter);
  const weekStart = addDays(date, -new Date(`${date}T00:00:00Z`).getUTCDay());
  const step = view === "day" ? 1 : view === "week" ? 7 : 0;

  const shift = (dir: number) => {
    if (view === "month") {
      const d = new Date(`${date.slice(0, 7)}-01T00:00:00Z`);
      d.setUTCMonth(d.getUTCMonth() + dir);
      setDate(d.toISOString().slice(0, 10));
    } else setDate(addDays(date, dir * step));
  };

  const act = async (id: string, body: unknown) => {
    const err = await api(`/api/appointments/${id}`, "PATCH", body);
    setMsg(err ?? "");
    await reload();
    return err;
  };

  const forDay = (d: string) => visible.filter((a) => a.date === d).sort((a, b) => a.time.localeCompare(b.time));
  const dayList = (d: string) => (
    <ul className="space-y-2">
      {forDay(d).length === 0 && <li className="text-sm text-gray-500">No appointments.</li>}
      {forDay(d).map((a) => (
        <AppointmentCard key={a.id} a={a} services={services} staff={staff} act={act} />
      ))}
    </ul>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="View" className="flex overflow-hidden rounded-lg border border-gray-300">
          {(["day", "week", "month"] as View[]).map((v) => (
            <button key={v} aria-pressed={view === v} onClick={() => setView(v)} className={`px-3 py-1.5 text-sm capitalize ${view === v ? "bg-violet-600 text-white" : "bg-white"}`}>{v}</button>
          ))}
        </div>
        <button className={btnGhost} aria-label="Previous" onClick={() => shift(-1)}>‹</button>
        <button className={btnGhost} onClick={() => setDate(fmtDate(new Date()))}>Today</button>
        <button className={btnGhost} aria-label="Next" onClick={() => shift(1)}>›</button>
        <span className="font-medium">{view === "month" ? date.slice(0, 7) : view === "week" ? `${weekStart} – ${addDays(weekStart, 6)}` : date}</span>
        <select aria-label="Filter by staff" className={`${inputCls} ml-auto w-auto`} value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
          <option value="all">All staff</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      {msg && <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{msg}</p>}

      {view === "day" && dayList(date)}
      {view === "week" && (
        <div className="grid gap-3 md:grid-cols-7">
          {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((d) => (
            <div key={d}>
              <h3 className="mb-1 text-sm font-semibold">{new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}</h3>
              {dayList(d)}
            </div>
          ))}
        </div>
      )}
      {view === "month" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className={cardCls}>
            <MonthGrid month={date} selected={date} onSelect={setDate} badge={(d) => forDay(d).filter((a) => a.status !== "cancelled").length} />
          </div>
          <div>
            <h3 className="mb-1 text-sm font-semibold">{date}</h3>
            {dayList(date)}
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ a, services, staff, act }: { a: Appointment; services: Service[]; staff: Staff[]; act: (id: string, body: unknown) => Promise<string | null> }) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(a.date);
  const [time, setTime] = useState(a.time);
  const [staffId, setStaffId] = useState(a.staffId);
  const sv = services.find((s) => s.id === a.serviceId);
  const st = staff.find((s) => s.id === a.staffId);
  return (
    <li className={`${cardCls} text-sm ${a.status === "cancelled" ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold">{fmt12(a.time)}–{fmt12(toTime(toMinutes(a.time) + (sv?.durationMin ?? 0)))} · {sv?.name}</div>
          <div className="text-gray-600">{a.customerName} · {a.customerPhone}</div>
          <div className="text-gray-500">{st?.name} · {money(sv?.priceCents ?? 0)}</div>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs ${badgeCls[a.status]}`}>{a.status}</span>
      </div>
      {a.status !== "cancelled" && !editing && (
        <div className="mt-2 flex flex-wrap gap-2">
          {a.status === "pending" && <button className={btnPrimary} onClick={() => act(a.id, { status: "confirmed" })}>Accept</button>}
          <button className={btnGhost} onClick={() => setEditing(true)}>Reschedule</button>
          <button className={btnDanger} onClick={() => confirm("Cancel this appointment?") && act(a.id, { status: "cancelled" })}>Cancel</button>
        </div>
      )}
      {editing && (
        <form className="mt-2 flex flex-wrap items-end gap-2" onSubmit={async (e) => { e.preventDefault(); if (!(await act(a.id, { date, time, staffId }))) setEditing(false); }}>
          <label className="text-xs">Date<input type="date" required className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="text-xs">Time<input type="time" step={1800} required className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} /></label>
          <label className="text-xs">Staff
            <select className={inputCls} value={staffId} onChange={(e) => setStaffId(e.target.value)}>
              {staff.filter((s) => s.serviceIds.includes(a.serviceId)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <button className={btnPrimary}>Save</button>
          <button type="button" className={btnGhost} onClick={() => setEditing(false)}>Close</button>
        </form>
      )}
    </li>
  );
}
