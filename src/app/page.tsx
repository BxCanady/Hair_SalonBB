import { Suspense } from "react";
import Home from "@/components/Home";
import TrendingStyles from "@/components/TrendingStyles";

export const metadata = { title: "Beast at Braid · Greensboro" };

export default function HomePage() {
  return (
    <Home>
      <Suspense
        fallback={
          <section className="border-t border-fuchsia-500/15 bg-[#140724] px-5 py-14 text-white">
            <div className="mx-auto max-w-5xl">
              <p className="text-sm text-purple-100/70">Loading this week&apos;s trends…</p>
            </div>
          </section>
        }
      >
        <TrendingStyles />
      </Suspense>
    </Home>
  );
}
