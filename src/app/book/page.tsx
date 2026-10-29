import { Suspense } from "react";
import BookingFlow from "@/components/BookingFlow";

export const metadata = { title: "Book an appointment · Beast at Braids" };

export default function BookPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-violet-700">Hair_SalonBB</h1>
        <a href="/dashboard" className="text-sm text-gray-500 underline">Owner login</a>
      </header>
      <Suspense fallback={<p className="text-gray-500">Loading…</p>}>
        <BookingFlow />
      </Suspense>
    </main>
  );
}
