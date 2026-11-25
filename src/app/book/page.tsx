import { Suspense } from "react";
import BookingFlow from "@/components/BookingFlow";

export const metadata = { title: "Book an appointment · Beast at Braids" };

export default function BookPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Beast@Braids</h1>
      </header>
      <Suspense fallback={<p className="text-white/70">Loading…</p>}>
        <BookingFlow />
      </Suspense>
    </main>
  );
}
