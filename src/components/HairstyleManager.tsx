"use client";
import { useCallback, useEffect, useState } from "react";
import HairstyleCard from "./HairstyleCard";
import { api, Button, cardCls, inputCls } from "./ui";
import { authHeaders } from "@/lib/adminClient";
import type { Hairstyle, Service } from "@/lib/types";

type Form = {
  title: string;
  description: string;
  imageUrl: string;
  serviceId: string;
  priceDollars: number;
  durationMin: number;
  isPublished: boolean;
};

const blank: Form = { title: "", description: "", imageUrl: "", serviceId: "", priceDollars: 0, durationMin: 60, isPublished: false };

export default function HairstyleManager({ services }: { services: Service[] }) {
  const [items, setItems] = useState<Hairstyle[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState<Form>(blank);
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/hairstyles?all=1", { headers: authHeaders() });
    if (!res.ok) return setErr("Could not load hairstyles");
    setItems(await res.json());
  }, []);

  useEffect(() => {
    let live = true;
    fetch("/api/hairstyles?all=1", { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => live && setItems(d))
      .catch(() => live && setErr("Could not load hairstyles"));
    return () => {
      live = false;
    };
  }, []);

  const edit = (h?: Hairstyle) => {
    setEditId(h?.id ?? "new");
    setF(h ? { title: h.title, description: h.description, imageUrl: h.imageUrl, serviceId: h.serviceId ?? "", priceDollars: h.priceCents / 100, durationMin: h.durationMin, isPublished: h.isPublished } : blank);
    setErr("");
  };

  async function upload(file: File) {
    setUploading(true);
    setErr("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", headers: authHeaders(), body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setErr(json.error ?? "Upload failed");
      setF((prev) => ({ ...prev, imageUrl: json.url }));
    } catch {
      setErr("Network error");
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { priceDollars, serviceId, ...rest } = f;
    const body = { ...rest, serviceId: serviceId || null, priceCents: Math.round(priceDollars * 100) };
    const e2 = editId === "new" ? await api("/api/hairstyles", "POST", body) : await api(`/api/hairstyles/${editId}`, "PATCH", body);
    if (e2) return setErr(e2);
    setEditId(null);
    await load();
  }

  async function patch(h: Hairstyle, body: Partial<Hairstyle>) {
    setErr((await api(`/api/hairstyles/${h.id}`, "PATCH", body)) ?? "");
    await load();
  }

  async function move(i: number, dir: -1 | 1) {
    const a = items[i];
    const b = items[i + dir];
    if (!a || !b) return;
    // Explicit neighbouring positions, so equal sort orders can't turn the swap into a no-op.
    const [top, bottom] = dir === -1 ? [a, b] : [b, a];
    const base = Math.min(a.sortOrder, b.sortOrder);
    const e1 = await api(`/api/hairstyles/${top.id}`, "PATCH", { sortOrder: base });
    const e2 = await api(`/api/hairstyles/${bottom.id}`, "PATCH", { sortOrder: base + 1 });
    setErr(e1 ?? e2 ?? "");
    await load();
  }

  async function remove(h: Hairstyle) {
    if (!confirm(`Delete ${h.title}? Unpublish it instead to hide it without deleting.`)) return;
    setErr((await api(`/api/hairstyles/${h.id}`, "DELETE")) ?? "");
    await load();
  }

  return (
    <div className="space-y-3">
      <Button size="sm" onClick={() => edit()}>Add hairstyle</Button>
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}

      {editId && (
        <form onSubmit={save} className={`${cardCls} grid gap-3 sm:grid-cols-2`}>
          <label className="text-sm">Title<input required maxLength={100} className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
          <label className="text-sm">Linked service
            <select className={inputCls} value={f.serviceId} onChange={(e) => setF({ ...f, serviceId: e.target.value })}>
              <option value="">None</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="text-sm">Starting price ($)<input type="number" min={0} step="0.01" required className={inputCls} value={f.priceDollars} onChange={(e) => setF({ ...f, priceDollars: Number(e.target.value) })} /></label>
          <label className="text-sm">Duration (min)<input type="number" min={15} step={15} required className={inputCls} value={f.durationMin} onChange={(e) => setF({ ...f, durationMin: Number(e.target.value) })} /></label>
          <label className="text-sm sm:col-span-2">Description<textarea maxLength={500} rows={2} className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
          <label className="text-sm sm:col-span-2">Photo (JPEG, PNG or WebP, up to 5 MB)
            <input type="file" accept="image/jpeg,image/png,image/webp" className={inputCls} disabled={uploading} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
          {uploading && <p className="text-sm text-gray-500 sm:col-span-2">Uploading…</p>}
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={f.isPublished} onChange={(e) => setF({ ...f, isPublished: e.target.checked })} /> Published (visible to customers)
          </label>
          {f.imageUrl && (
            <div className="sm:col-span-2">
              <p className="mb-1 text-sm text-gray-500">Customer preview</p>
              <div className="w-56"><HairstyleCard hairstyle={{ ...f, priceCents: Math.round(f.priceDollars * 100), serviceId: f.serviceId || null }} /></div>
            </div>
          )}
          <div className="flex gap-2 sm:col-span-2">
            <Button size="sm" type="submit" disabled={uploading || !f.imageUrl}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
          </div>
        </form>
      )}

      <ul className="space-y-2">
        {items.map((h, i) => (
          <li key={h.id} className={`${cardCls} flex items-center gap-3 text-sm`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={h.imageUrl} alt={`${h.title} thumbnail`} className="h-16 w-12 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{h.title} {!h.isPublished && <span className="font-normal text-gray-500">· Draft</span>}</div>
              <div className="text-gray-500">${(h.priceCents / 100).toFixed(2)} · {h.durationMin} min</div>
            </div>
            <div className="flex flex-wrap justify-end gap-1">
              <Button size="sm" variant="ghost" aria-label={`Move ${h.title} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</Button>
              <Button size="sm" variant="ghost" aria-label={`Move ${h.title} down`} disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓</Button>
              <Button size="sm" variant="ghost" onClick={() => patch(h, { isPublished: !h.isPublished })}>{h.isPublished ? "Unpublish" : "Publish"}</Button>
              <Button size="sm" variant="ghost" onClick={() => edit(h)}>Edit</Button>
              <Button size="sm" variant="danger" onClick={() => remove(h)}>Delete</Button>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-gray-500">No hairstyles yet.</li>}
      </ul>
    </div>
  );
}
