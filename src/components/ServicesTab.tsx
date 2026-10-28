"use client";
import { useState } from "react";
import { api, Button, cardCls, inputCls } from "./ui";
import { money } from "@/lib/time";
import type { Service } from "@/lib/types";

const blank = { name: "", category: "", description: "", durationMin: 60, priceDollars: 0 };

export default function ServicesTab({ services, reload }: { services: Service[]; reload: () => Promise<void> }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState(blank);
  const [err, setErr] = useState("");

  const edit = (s?: Service) => {
    setEditId(s?.id ?? "new");
    setF(s ? { name: s.name, category: s.category, description: s.description, durationMin: s.durationMin, priceDollars: s.priceCents / 100 } : blank);
    setErr("");
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const body = { ...f, priceCents: Math.round(f.priceDollars * 100) };
    const e2 = editId === "new" ? await api("/api/services", "POST", body) : await api(`/api/services/${editId}`, "PUT", body);
    if (e2) return setErr(e2);
    setEditId(null);
    await reload();
  }

  async function remove(s: Service) {
    if (!confirm(`Delete ${s.name}?`)) return;
    setErr((await api(`/api/services/${s.id}`, "DELETE")) ?? "");
    await reload();
  }

  return (
    <div className="space-y-3">
      <Button size="sm" onClick={() => edit()}>Add service</Button>
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      {editId && (
        <form onSubmit={save} className={`${cardCls} grid gap-3 sm:grid-cols-2`}>
          <label className="text-sm">Name<input required className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label className="text-sm">Category<input required className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></label>
          <label className="text-sm">Duration (min)<input type="number" min={15} step={15} required className={inputCls} value={f.durationMin} onChange={(e) => setF({ ...f, durationMin: Number(e.target.value) })} /></label>
          <label className="text-sm">Price ($)<input type="number" min={0} step="0.01" required className={inputCls} value={f.priceDollars} onChange={(e) => setF({ ...f, priceDollars: Number(e.target.value) })} /></label>
          <label className="text-sm sm:col-span-2">Description<input className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
          {err && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{err}</p>}
          <div className="flex gap-2 sm:col-span-2"><Button size="sm" type="submit">Save</Button><Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button></div>
        </form>
      )}
      <ul className="space-y-2">
        {services.map((s) => (
          <li key={s.id} className={`${cardCls} flex items-center justify-between gap-2 text-sm`}>
            <div><div className="font-semibold">{s.name} <span className="font-normal text-gray-500">· {s.category}</span></div><div className="text-gray-500">{s.durationMin} min · {money(s.priceCents)}</div></div>
            <div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => edit(s)}>Edit</Button><Button size="sm" variant="danger" onClick={() => remove(s)}>Delete</Button></div>
          </li>
        ))}
      </ul>
    </div>
  );
}
