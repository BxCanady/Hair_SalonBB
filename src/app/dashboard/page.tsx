import { Suspense } from "react";
import Dashboard from "@/components/Dashboard";

export const metadata = { title: "Owner dashboard · Hair_SalonBB" };

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-violet-700">Owner dashboard</h1>
        <a href="/book" className="text-sm text-gray-500 underline">Customer booking page</a>
      </header>
      <Suspense fallback={<p className="text-gray-500">Loading…</p>}>
        <Dashboard />
      </Suspense>
    </main>
  );
}
