"use client";

import { TRIP_CONFIG } from "@/lib/types";

export default function ShareSection() {
  async function handleShare() {
    const shareData = {
      title: TRIP_CONFIG.title,
      text: TRIP_CONFIG.subtitle,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled — no-op.
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard && shareData.url) {
      await navigator.clipboard.writeText(shareData.url);
      alert("Link copied to clipboard");
    }
  }

  return (
    <section className="border-t border-hairline px-6 py-24 text-center">
      <p className="font-display text-2xl text-ivory sm:text-3xl">
        Shared memories are better memories.
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm text-smoke">
        Download your favorite moments and keep them forever.
      </p>
      <button
        type="button"
        onClick={handleShare}
        className="mt-8 inline-flex items-center gap-2 border border-hairline px-7 py-3 font-mono text-xs uppercase tracking-[0.2em] text-ivory transition-colors hover:border-brass hover:text-brass"
      >
        Share this gallery
      </button>
    </section>
  );
}
