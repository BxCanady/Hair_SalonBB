"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const INTRO = "/video/vid2.mp4";
const LOOP = "/video/vid1.mp4";

export default function HomeVideo() {
  const [phase, setPhase] = useState<"intro" | "loop">("intro");
  const [run, setRun] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting && entry.intersectionRatio >= 0.35),
      { threshold: [0, 0.35, 0.6] },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isVisible) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isVisible, phase, run]);

  const restart = () => {
    setPhase("intro");
    setRun((r) => r + 1);
    setIsVisible(true);
  };

  return (
    <motion.div
      ref={containerRef}
      className="relative pt-4 [perspective:1000px]"
      initial={reduceMotion ? false : { opacity: 0, y: 36, rotateX: 8 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.h2
        className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-black px-4 py-1 text-base font-semibold text-accent"
        animate={reduceMotion ? undefined : {
          textShadow: [
            "0 0 4px #e546d8, 0 0 10px #e546d8",
            "0 0 10px #8b3dff, 0 0 24px #8b3dff, 0 0 36px #e546d8",
            "0 0 4px #e546d8, 0 0 10px #e546d8",
          ],
          boxShadow: [
            "0 0 6px #e546d8",
            "0 0 18px #8b3dff",
            "0 0 6px #e546d8",
          ],
        }}
        transition={reduceMotion ? undefined : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        Let Me Enhance Your Beauty
      </motion.h2>
      <motion.section
        className="relative aspect-video overflow-hidden rounded-xl border-2 border-secondary bg-black shadow-[0_20px_60px_rgba(139,61,255,0.28)] [transform-style:preserve-3d]"
        whileHover={reduceMotion ? undefined : { scale: 1.008, rotateX: -1, rotateY: 1 }}
        transition={{ duration: 0.35 }}
      >
      <AnimatePresence mode="sync">
        <motion.video
          ref={videoRef}
          key={`${phase}-${run}`}
          src={phase === "intro" ? INTRO : LOOP}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay={isVisible}
          muted
          playsInline
          preload="metadata"
          loop={phase === "loop"}
          onEnded={phase === "intro" ? () => setPhase("loop") : undefined}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6 }}
        />
      </AnimatePresence>
      <button
        type="button"
        onClick={restart}
        aria-label="Restart video"
        className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-primary hover:text-black"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
      </motion.section>
    </motion.div>
  );
}
