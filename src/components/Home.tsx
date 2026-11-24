import Link from "next/link";
import type { ReactNode } from "react";
import HomeHero from "./HomeHero";
import HomeVideo from "./HomeVideo";
import HairstyleCarousel from "./HairstyleCarousel";
import HomeInfo from "./HomeInfo";

export default function Home({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-3 py-4 md:gap-12 md:px-6 md:py-8">
        <HomeHero />
        <HomeVideo />
        <HairstyleCarousel />
        {children}
        <HomeInfo />
        <section className="rounded-3xl border border-primary/30 bg-gradient-to-br from-black/80 to-[#351047] p-6 text-center md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Ready when you are</p>
          <h2 className="mt-2 text-3xl font-bold text-white">Your next look starts here.</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/70">
            Pick a service, see live availability, and reserve your appointment online.
          </p>
          <Link
            href="/book"
            className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 font-bold text-black transition hover:bg-[#f052e5]"
          >
            Book an Appointment
          </Link>
        </section>
        <footer className="border-t border-white/10 py-6 text-center text-sm text-white/60">
          <p className="font-semibold text-white">Beast at Braid · Greensboro, NC</p>
          <p className="mt-1">Appointments and current hours are shown in the online booking calendar.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">
            <Link href="/book" className="font-semibold text-primary hover:text-white">Check availability</Link>
            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:text-white">Instagram</a>
            <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:text-white">Facebook</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
