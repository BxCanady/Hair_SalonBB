"use client";
import { useState } from "react";
import { api, btnDanger, btnGhost, btnPrimary, cardCls, inputCls } from "./ui";
import type { Service, Staff, WorkingHours } from "@/lib/types";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const defaultHours = (): WorkingHours => DAYS.map((_, i) => (i === 0 ? null : { start: "09:00", end: "17:00" }));
const blank = { name: "", role: "", email: "", serviceIds: [] as string[], workingHours: defaultHours() };

export default function StaffTab({ services, staff, reload }: { services: Service[]; staff: Staff[]; reload: () => Promise<void> }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState(blank);
  const [err, setErr] = useState("");

  const edit = (s?: Staff) => {
    setEditId(s?.id ?? "new");
    setF(s ? { name: s.name, role: s.role, email: s.email, serviceIds: s.serviceIds, workingHours: s.workingHours.map((h) => (h ? { ...h } : null)) } : { ...blank, workingHours: defaultHours() });
    setErr("");
  };

  const setDay = (i: number, h: { start: string; end: string } | null) =>
    setF({ ...f, workingHours: f.workingHours.map((x, j) => (j === i ? h : x)) });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const e2 = editId === "new" ? await api("/api/staff", "POST", f) : await api(`/api/staff/${editId}`, "PUT", f);
    if (e2) return setErr(e2);
    setEditId(null);
    await reload();
  }

  async function remove(s: Staff) {
    if (!confirm(`Remove ${s.name}?`)) return;
    setErr((await api(`/api/staff/${s.id}`, "DELETE")) ?? "");
    await reload();
  }

  return (
    <div className="space-y-3">
      <button className={btnPrimary} onClick={() => edit()}>Add staff member</button>
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      {editId && (
        <form onSubmit={save} className={`${cardCls} space-y-3`}>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm">Name<input required className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label className="text-sm">Role<input required className={inputCls} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} /></label>
            <label className="text-sm">Email<input type="email" required className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          </div>
          <fieldset><legend className="text-sm font-medium">Services offered</legend>
            <div className="mt-1 flex flex-wrap gap-3">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-1 text-sm">
                  <input type="checkbox" checked={f.serviceIds.includes(s.id)} onChange={(e) => setF({ ...f, serviceIds: e.target.checked ? [...f.serviceIds, s.id] : f.serviceIds.filter((x) => x !== s.id) })} />
                  {s.name}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset><legend className="text-sm font-medium">Working hours</legend>
            <div className="mt-1 space-y-1">
              {DAYS.map((d, i) => {
                const h = f.workingHours[i];
                return (
                  <div key={d} className="flex items-center gap-2 text-sm">
                    <label className="flex w-20 items-center gap-1"><input type="checkbox" checked={!!h} onChange={(e) => setDay(i, e.target.checked ? { start: "09:00", end: "17:00" } : null)} />{d}</label>
                    {h ? (
                      <>
                        <input aria-label={`${d} start`} type="time" required className={`${inputCls} w-32`} value={h.start} onChange={(e) => setDay(i, { ...h, start: e.target.value })} />
                        <span>to</span>
                        <input aria-label={`${d} end`} type="time" required className={`${inputCls} w-32`} value={h.end} onChange={(e) => setDay(i, { ...h, end: e.target.value })} />
                      </>
                    ) : <span className="text-gray-400">Off</span>}
                  </div>
                );
              })}
            </div>
          </fieldset>
          {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
          <div className="flex gap-2"><button className={btnPrimary}>Save</button><button type="button" className={btnGhost} onClick={() => setEditId(null)}>Cancel</button></div>
        </form>
      )}
      <ul className="space-y-2">
        {staff.map((s) => (
          <li key={s.id} className={`${cardCls} flex items-center justify-between gap-2 text-sm`}>
            <div><div className="font-semibold">{s.name} <span className="font-normal text-gray-500">· {s.role}</span></div>
              <div className="text-gray-500">{s.email} · {s.serviceIds.length} services · works {s.workingHours.filter(Boolean).length} days/week</div></div>
            <div className="flex gap-2"><button className={btnGhost} onClick={() => edit(s)}>Edit</button><button className={btnDanger} onClick={() => remove(s)}>Remove</button></div>
          </li>
        ))}
      </ul>
    </div>
  );
}
