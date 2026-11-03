"use client";
import { useEffect, useRef, useState } from "react";
import HairstyleCard from "./HairstyleCard";
import type { Hairstyle } from "@/lib/types";

type State = { status: "loading" } | { status: "error" } | { status: "ready"; items: Hairstyle[] };

export default function HairstyleCarousel() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/hairstyles", { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<Hairstyle[]>;
      })
      .then((items) => setState({ status: "ready", items }))
      .catch((e) => e.name !== "AbortError" && setState({ status: "error" }));
    return () => ctrl.abort();
  }, [attempt]);

  const scrollBy = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const arrow = "hidden h-9 w-9 items-center justify-center rounded-full border border-primary bg-black/70 text-primary transition hover:bg-primary hover:text-black md:flex";

  return (
    <section aria-labelledby="h-styles" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="h-styles" className="text-xl font-semibold text-accent">Signature Styles</h2>
        {state.status === "ready" && state.items.length > 1 && (
          <div className="flex gap-2">
            <button type="button" aria-label="Previous styles" onClick={() => scrollBy(-1)} className={arrow}>‹</button>
            <button type="button" aria-label="Next styles" onClick={() => scrollBy(1)} className={arrow}>›</button>
          </div>
        )}
      </div>

      {state.status === "loading" && (
        <div className="flex gap-3 overflow-hidden" aria-busy="true" aria-label="Loading hairstyles">
          {[0, 1].map((i) => (
            <div key={i} className="h-96 w-[82%] shrink-0 animate-pulse rounded-2xl border border-[#74216d] bg-[#171017] md:w-72" />
          ))}
        </div>
      )}

      {state.status === "error" && (
        <p role="alert" className="rounded-2xl border border-[#74216d] bg-[#171017] p-4 text-sm text-[#cfc0cd]">
          Couldn&apos;t load our styles right now.{" "}
          <button type="button" onClick={() => { setState({ status: "loading" }); setAttempt((n) => n + 1); }} className="text-primary underline">Try again</button>
        </p>
      )}

      {state.status === "ready" && state.items.length === 0 && (
        <p className="rounded-2xl border border-[#74216d] bg-[#171017] p-4 text-sm text-[#cfc0cd]">New styles are coming soon. Check back shortly!</p>
      )}

      {state.status === "ready" && state.items.length > 0 && (
        <div
          ref={track}
          tabIndex={0}
          role="region"
          aria-label="Hairstyle gallery"
          className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-3 pb-3 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {state.items.map((h) => (
            <div key={h.id} className="w-[82%] shrink-0 snap-start sm:w-64 md:w-72">
              <HairstyleCard hairstyle={h} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
