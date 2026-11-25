"use client";
import { useCallback, useEffect, useState } from "react";
import HairstyleCard from "./HairstyleCard";
import FallbackImage from "./FallbackImage";
import { api, Button } from "./ui";
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
const field =
  "mt-1.5 w-full min-h-11 rounded-xl border border-white/15 bg-black/35 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20";
const action =
  "inline-flex min-h-9 items-center justify-center rounded-lg border border-white/15 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white transition hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-35";

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
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-secondary to-primary p-px sm:flex-row sm:items-center sm:justify-between">
        <div className="rounded-[15px] bg-[#13091f] px-4 py-3 sm:rounded-r-none">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Customer lookbook</p>
          <h2 className="mt-1 text-xl font-bold text-white">Hairstyles</h2>
          <p className="mt-1 text-sm leading-5 text-white/65">Add styles, link services, and control what customers see.</p>
        </div>
        <div className="px-4 pb-3 sm:pb-0 sm:pr-4">
          <Button onClick={() => edit()} className="min-h-11 w-full sm:w-auto">Add hairstyle</Button>
        </div>
      </div>
      {err && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">{err}</p>}

      {editId && (
        <form onSubmit={save} className="grid gap-5 rounded-2xl border border-white/10 bg-[#171017] p-4 shadow-xl sm:p-6 lg:grid-cols-[1fr_18rem]">
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-white">
                Title
                <input required maxLength={100} className={field} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
              </label>
              <label className="block text-sm font-semibold text-white">
                Linked service
                <select className={`${field} [color-scheme:dark]`} value={f.serviceId} onChange={(e) => setF({ ...f, serviceId: e.target.value })}>
                  <option value="">None</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-white">
                Starting price ($)
                <input type="number" min={0} step="0.01" required className={field} value={f.priceDollars} onChange={(e) => setF({ ...f, priceDollars: Number(e.target.value) })} />
              </label>
              <label className="block text-sm font-semibold text-white">
                Duration (min)
                <input type="number" min={15} step={15} required className={field} value={f.durationMin} onChange={(e) => setF({ ...f, durationMin: Number(e.target.value) })} />
              </label>
            </div>
            <label className="block text-sm font-semibold text-white">
              Description
              <textarea maxLength={500} rows={3} className={`${field} resize-y`} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
            </label>
            <label className="block text-sm font-semibold text-white">
              Photo
              <span className="mt-1 block text-xs font-normal text-white/50">JPEG, PNG or WebP, up to 5 MB</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className={`${field} file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-black`}
                disabled={uploading}
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
            </label>
            {uploading && <p className="text-sm text-primary">Uploading photo…</p>}
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-white">
              <input type="checkbox" className="h-4 w-4 accent-[#e546d8]" checked={f.isPublished} onChange={(e) => setF({ ...f, isPublished: e.target.checked })} />
              Publish this hairstyle to the customer lookbook
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={uploading || !f.imageUrl} className="min-h-11">Save hairstyle</Button>
              <Button variant="ghost" onClick={() => setEditId(null)} className="min-h-11">Cancel</Button>
            </div>
          </div>
          <aside className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Customer preview</p>
            {f.imageUrl ? (
              <HairstyleCard hairstyle={{ ...f, priceCents: Math.round(f.priceDollars * 100), serviceId: f.serviceId || null }} />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-6 text-center text-sm leading-6 text-white/45">
                Upload a photo to preview this look.
              </div>
            )}
          </aside>
        </form>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Lookbook styles</h3>
          <span className="text-sm text-white/50">{items.length} total</span>
        </div>
        <ul className="space-y-3">
          {items.map((h, i) => (
            <li key={h.id} className="rounded-2xl border border-white/10 bg-[#171017] p-3 shadow-lg sm:p-4">
              <div className="flex gap-3">
                <FallbackImage
                  src={h.imageUrl}
                  title={h.title}
                  alternativeUrls={h.imageAlternativeUrls}
                  alt={`${h.title} thumbnail`}
                  className="h-20 w-16 shrink-0 rounded-xl object-cover sm:h-24 sm:w-20"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate font-bold text-white">{h.title}</h4>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      h.isPublished ? "bg-green-500/15 text-green-300" : "bg-white/10 text-white/50"
                    }`}>
                      {h.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white/60">${(h.priceCents / 100).toFixed(2)} · {h.durationMin} min</p>
                  {h.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/40">{h.description}</p>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
                <button type="button" className={action} aria-label={`Move ${h.title} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑ Move up</button>
                <button type="button" className={action} aria-label={`Move ${h.title} down`} disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓ Move down</button>
                <button type="button" className={action} onClick={() => patch(h, { isPublished: !h.isPublished })}>{h.isPublished ? "Unpublish" : "Publish"}</button>
                <button type="button" className={action} onClick={() => edit(h)}>Edit</button>
                <button type="button" className={`${action} border-red-500/25 text-red-200 hover:border-red-400 hover:bg-red-950/40`} onClick={() => remove(h)}>Delete</button>
              </div>
            </li>
          ))}
          {items.length === 0 && (
            <li className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center text-sm text-white/50">
              No hairstyles yet. Add the first look to start your customer gallery.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
