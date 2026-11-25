"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const taglineSets = [
  [
    "Micro Loc Specialists",
    "Mini Loc Installations & More",
    "Short Hair Gripper",
    "Custom Braided Perfection",
    "Greensboro's Beauty Destination",
    "Consult • Style • Slay",
  ],
  [
    "Your Crown Deserves More.",
    "Designed for Queens.",
    "Luxury in Every Strand.",
    "Confidence Starts Here.",
    "Beauty Worth Booking.",
    "A Crown Worth Wearing.",
  ],
  [
    "Book Your Next Look Today",
    "Limited Appointments Available",
    "Custom Styles Tailored To You",
    "Professional Braiding Services",
    "Secure Your Spot Online",
    "Transform Your Hair Experience",
  ],
];

const LINES = taglineSets[0].length;
const INTERVAL_MS = 4000;

const socials = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/",
    path: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM17.5 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/",
    path: "M13.5 22v-8.5H17l.5-3.5h-4V7.8c0-1 .3-1.8 1.8-1.8H17.7V3c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5V10H7.5v3.5h3.2V22h2.8z",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/",
    path: "M16.5 2h-3v13.2a2.8 2.8 0 1 1-2-2.7V9.4a5.8 5.8 0 1 0 5 5.8V8.6a7 7 0 0 0 4 1.3V6.9a4 4 0 0 1-4-4.9z",
  },
];

function SocialIcons() {
  return (
    <ul className="flex items-center justify-center gap-3">
      {socials.map((s) => (
        <li key={s.label}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary text-primary transition hover:bg-primary hover:text-black"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
              <path d={s.path} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function HomeHero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % taglineSets.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-black/55 shadow-2xl backdrop-blur-sm">
      <div className="grid md:grid-cols-[0.9fr_1.1fr]">
        <div className="order-2 flex flex-col justify-center gap-5 p-6 md:order-1 md:p-10">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo/logo.png"
            alt="Beast at Braid logo"
            className="h-28 w-28 shrink-0 rounded-full border-2 border-primary object-cover shadow-[0_0_28px_rgba(229,70,216,0.4)] md:h-36 md:w-36"
          />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Greensboro, North Carolina</p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-white/65">Custom braids • Micro locs • Short-hair grip</p>
          <h1 className="text-4xl font-bold leading-[1.05] text-white md:text-5xl">
            A crown made for <span className="text-primary">you.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/75">
            Clean, intentional installs with a look tailored to your texture, length, and lifestyle.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/book"
            className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-black transition hover:bg-[#f052e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Book Now
          </Link>
          <a
            href="#lookbook"
            className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-primary hover:bg-primary/10"
          >
            Explore looks
          </a>
        </div>
        <SocialIcons />
        </div>

        <div className="relative order-1 min-h-72 overflow-hidden md:order-2 md:min-h-[34rem]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero.png"
          alt="Braided hairstyle by Beast at Braid"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/5 md:bg-gradient-to-r md:from-black/75 md:via-transparent md:to-black/5" />
        <ul className="absolute inset-x-0 bottom-0 p-6 text-base font-semibold leading-snug text-white drop-shadow-lg md:p-8 md:text-lg">
          {Array.from({ length: LINES }, (_, line) => (
            <li key={line} className="relative h-[1.55em] overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={index}
                  className="block truncate"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, delay: line * 0.08 }}
                >
                  {taglineSets[index][line]}
                </motion.span>
              </AnimatePresence>
            </li>
          ))}
        </ul>
        </div>
      </div>
    </section>
  );
}
