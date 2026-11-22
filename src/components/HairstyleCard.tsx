import Link from "next/link";
import { bookHref } from "@/lib/links";
import { fmtDuration, money } from "@/lib/time";
import type { Hairstyle } from "@/lib/types";

export default function HairstyleCard({ hairstyle: h }: { hairstyle: Pick<Hairstyle, "title" | "description" | "imageUrl" | "serviceId" | "priceCents" | "durationMin"> }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#74216d] bg-[#171017] text-white transition hover:-translate-y-1 hover:border-primary hover:shadow-[0_0_24px_rgba(223,56,213,0.35)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={h.imageUrl}
        alt={`${h.title} hairstyle`}
        loading="lazy"
        className="aspect-[4/5] w-full rounded-b-2xl object-cover"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lg font-semibold">{h.title}</h3>
        {h.description && <p className="text-sm text-[#cfc0cd]">{h.description}</p>}
        <p className="mt-auto text-sm text-[#cfc0cd]">
          From <span className="font-semibold text-white">{money(h.priceCents)}</span> · about {fmtDuration(h.durationMin)}
        </p>
        <Link
          href={bookHref(h.serviceId)}
          className="mt-2 rounded-lg bg-primary px-4 py-2 text-center text-sm font-semibold text-black transition hover:bg-[#f052e5]"
        >
          Book This Look
        </Link>
      </div>
    </article>
  );
}
