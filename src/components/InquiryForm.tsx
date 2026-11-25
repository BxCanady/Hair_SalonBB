"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const input =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function InquiryForm() {
  const params = useSearchParams();
  const initialStyle = (params.get("style") ?? "").trim();
  const sourceUrl = (params.get("source") ?? "").trim();
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    message: initialStyle ? `Hi! I'd like to ask about ${initialStyle}.` : "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ styleName: initialStyle, sourceUrl, ...form }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not send inquiry");
      setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send inquiry");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <section className="rounded-3xl border border-primary/30 bg-black/60 p-6 text-center" aria-live="polite">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary font-bold text-black">✓</div>
        <h2 className="mt-4 text-2xl font-bold text-white">Inquiry sent</h2>
        <p className="mt-2 text-sm leading-6 text-white/70">
          The stylist received your request{initialStyle ? ` about ${initialStyle}` : ""} and will follow up using your contact details.
        </p>
        <Link href="/" className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-black">
          Back to homepage
        </Link>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl border border-white/10 bg-black/60 p-5 shadow-2xl">
      <label className="block text-sm font-medium text-white">
        Style
        <input
          className={`${input} mt-1`}
          value={initialStyle}
          readOnly
          aria-readonly="true"
        />
      </label>
      <label className="block text-sm font-medium text-white">
        Name
        <input
          required
          autoComplete="name"
          className={`${input} mt-1`}
          value={form.customerName}
          onChange={(event) => setForm({ ...form, customerName: event.target.value })}
        />
      </label>
      <label className="block text-sm font-medium text-white">
        Email
        <input
          required
          type="email"
          autoComplete="email"
          className={`${input} mt-1`}
          value={form.customerEmail}
          onChange={(event) => setForm({ ...form, customerEmail: event.target.value })}
        />
      </label>
      <label className="block text-sm font-medium text-white">
        Phone
        <input
          required
          type="tel"
          autoComplete="tel"
          pattern="[\d\s()+.\-]{7,}"
          className={`${input} mt-1`}
          value={form.customerPhone}
          onChange={(event) => setForm({ ...form, customerPhone: event.target.value })}
        />
      </label>
      <label className="block text-sm font-medium text-white">
        Questions or inspiration details
        <textarea
          rows={5}
          maxLength={1000}
          placeholder="Tell us about your hair length, desired date, colors, or questions."
          className={`${input} mt-1 resize-y`}
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
        />
      </label>
      {error && <p role="alert" className="rounded-lg bg-red-950/60 p-3 text-sm text-red-200">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !initialStyle}
        className="w-full rounded-xl bg-primary px-5 py-3 font-bold text-black transition hover:bg-[#f052e5] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Send Inquiry"}
      </button>
    </form>
  );
}
