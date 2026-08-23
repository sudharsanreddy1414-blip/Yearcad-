"use client";

import { motion } from "framer-motion";
import type { Photo } from "@/lib/types";
import { TRIP_CONFIG } from "@/lib/types";

function Sprockets() {
  return (
    <div className="absolute inset-x-0 flex justify-between px-3 opacity-60" aria-hidden>
      {Array.from({ length: 24 }).map((_, i) => (
        <span key={i} className="h-2 w-2 rounded-[2px] bg-void/70 backdrop-blur-sm" />
      ))}
    </div>
  );
}

export default function Hero({
  photoCount,
  coverPhoto,
}: {
  photoCount: number;
  coverPhoto?: Photo;
}) {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-void">
      {/* Background collage / cover photo */}
      <div className="absolute inset-0">
        {coverPhoto?.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverPhoto.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover opacity-50 scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-charcoal to-void" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-void/60 via-void/70 to-void" />
        <div className="absolute inset-0 bg-gradient-to-r from-void/40 via-transparent to-void/40" />
      </div>

      <div className="absolute top-6 left-0 right-0">
        <Sprockets />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto w-full max-w-4xl px-6 text-center"
      >
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-brass">
          {TRIP_CONFIG.location}
        </p>

        <h1 className="mt-6 font-display text-5xl leading-[1.05] tracking-tight text-ivory sm:text-6xl md:text-7xl">
          {TRIP_CONFIG.title}
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-balance text-base text-smoke sm:text-lg">
          {TRIP_CONFIG.subtitle}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-xs uppercase tracking-[0.2em] text-smoke-dim">
          <span>
            📍 {TRIP_CONFIG.location}
          </span>
          <span>
            📸 {photoCount} {photoCount === 1 ? "Memory" : "Memories"}
          </span>
        </div>

        <a
          href="#gallery"
          className="group mt-12 inline-flex items-center gap-2 border border-hairline px-7 py-3 font-mono text-xs uppercase tracking-[0.2em] text-ivory transition-colors hover:border-brass hover:text-brass"
        >
          Explore Memories
          <span className="transition-transform group-hover:translate-y-0.5">↓</span>
        </a>
      </motion.div>

      <div className="absolute bottom-6 left-0 right-0">
        <Sprockets />
      </div>
    </section>
  );
}
