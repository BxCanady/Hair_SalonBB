"use client";

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
    <section className="grid grid-cols-2 items-center gap-3">
      <div className="flex flex-col gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo/logo.png"
          alt="Beast at Braid logo"
          className=" relative top-[-40px] h-36 w-36 self-start rounded-full border-2 border-primary object-cover"
        />
      </div>
      <div className="relative top-[70px] flex flex-col gap-3">
        <SocialIcons />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero.png"
          alt="Braided hairstyle by Beast at Braid"
          className="aspect-[4/5] w-full rounded-md border-2 border-secondary bg-surface object-cover"
        />
      </div>
      <ul className=" relative top-[-100px] col-span-2 text-lg leading-snug text-foreground">
        {Array.from({ length: LINES }, (_, line) => (
          <li key={line} className="relative h-[1.4em] overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={index}
                className="block"
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
    </section>
  );
}
