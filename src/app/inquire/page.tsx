import { Suspense } from "react";
import InquiryForm from "@/components/InquiryForm";

export const metadata = { title: "Ask about a style · Beast at Braid" };

export default function InquirePage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8 text-white">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Consult before you book</p>
        <h1 className="mt-2 text-3xl font-bold">Ask your stylist</h1>
        <p className="mt-3 text-sm leading-6 text-white/70">
          Send your hair goals and questions. The stylist can confirm pricing, prep, hair requirements, and the best appointment length.
        </p>
      </header>
      <Suspense fallback={<p className="text-white/60">Loading inquiry form…</p>}>
        <InquiryForm />
      </Suspense>
    </main>
  );
}
