"use client";

import { useEffect, useState } from "react";
import { authHeaders } from "@/lib/adminClient";
import type { StyleInquiry, StyleInquiryStatus } from "@/lib/types";

export default function InquiriesTab() {
  const [items, setItems] = useState<StyleInquiry[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchItems() {
    const response = await fetch("/api/inquiries", { headers: authHeaders(), cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Could not load inquiries");
    return data as StyleInquiry[];
  }

  useEffect(() => {
    fetchItems()
      .then(setItems)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load inquiries"))
      .finally(() => setLoading(false));
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setItems(await fetchItems());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load inquiries");
    } finally {
      setLoading(false);
    }
  }

  async function update(id: string, status: StyleInquiryStatus) {
    const response = await fetch(`/api/inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      setError("Could not update inquiry");
      return;
    }
    setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
  }

  if (loading) return <p className="text-sm text-gray-500">Loading inquiries…</p>;
  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>;

  return (
    <section aria-labelledby="inquiries-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="inquiries-heading" className="text-lg font-semibold">Style inquiries</h2>
        <button type="button" onClick={() => void load()} className="text-sm font-semibold text-violet-700 underline">Refresh</button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No style inquiries yet.</p>
      ) : (
        items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-950">{item.styleName}</p>
                <p className="text-sm text-gray-600">{item.customerName}</p>
                <a href={`mailto:${item.customerEmail}`} className="block text-sm text-violet-700">{item.customerEmail}</a>
                <a href={`tel:${item.customerPhone}`} className="block text-sm text-violet-700">{item.customerPhone}</a>
              </div>
              <select
                aria-label={`Status for ${item.styleName} inquiry`}
                value={item.status}
                onChange={(event) => void update(item.id, event.target.value as StyleInquiryStatus)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            {item.message && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{item.message}</p>}
            {item.sourceUrl && (
              <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-violet-700">
                Open inspiration source ↗
              </a>
            )}
            <p className="mt-3 text-xs text-gray-400">Received {new Date(item.createdAt).toLocaleString()}</p>
          </article>
        ))
      )}
    </section>
  );
}
