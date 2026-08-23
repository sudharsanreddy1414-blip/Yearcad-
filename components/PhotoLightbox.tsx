"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Photo } from "@/lib/types";

export default function PhotoLightbox({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const photo = photos[index];
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const fullLoaded = loadedId === photo?.id;
  const touchStartX = useRef<number | null>(null);

  const goNext = useCallback(
    () => onNavigate((index + 1) % photos.length),
    [index, photos.length, onNavigate]
  );
  const goPrev = useCallback(
    () => onNavigate((index - 1 + photos.length) % photos.length),
    [index, photos.length, onNavigate]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev]);

  if (!photo) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex flex-col bg-void/97 backdrop-blur-md"
      onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(delta) > 50) (delta < 0 ? goNext : goPrev)();
        touchStartX.current = null;
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <span className="font-mono text-xs tracking-[0.2em] text-smoke">
          FRAME{" "}
          <span className="text-ivory">{String(index + 1).padStart(3, "0")}</span> /{" "}
          {String(photos.length).padStart(3, "0")}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="font-mono text-xs uppercase tracking-[0.2em] text-smoke transition-colors hover:text-brass"
        >
          Close ✕
        </button>
      </div>

      {/* Image area */}
      <div className="relative flex flex-1 items-center justify-center px-2 pb-4">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous photo"
          className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 border border-hairline bg-void/60 px-3 py-4 text-ivory transition-colors hover:border-brass hover:text-brass sm:block"
        >
          ‹
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex max-h-full max-w-full items-center justify-center"
          >
            {!fullLoaded && photo.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo.thumbnailUrl}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full scale-105 object-contain opacity-60 blur-sm"
              />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/image/${photo.id}`}
              alt={photo.name}
              onLoad={() => setLoadedId(photo.id)}
              className="max-h-[75svh] max-w-full object-contain sm:max-h-[80svh]"
            />
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          onClick={goNext}
          aria-label="Next photo"
          className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 border border-hairline bg-void/60 px-3 py-4 text-ivory transition-colors hover:border-brass hover:text-brass sm:block"
        >
          ›
        </button>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col items-center gap-3 px-4 pb-6 sm:flex-row sm:justify-between sm:px-6">
        <p className="max-w-full truncate font-mono text-xs text-smoke-dim">{photo.name}</p>

        <div className="flex items-center gap-3">
          <div className="flex gap-2 sm:hidden">
            <button
              type="button"
              onClick={goPrev}
              className="border border-hairline px-4 py-2 font-mono text-xs uppercase tracking-[0.15em] text-ivory"
            >
              ‹ Prev
            </button>
            <button
              type="button"
              onClick={goNext}
              className="border border-hairline px-4 py-2 font-mono text-xs uppercase tracking-[0.15em] text-ivory"
            >
              Next ›
            </button>
          </div>

          <a
            href={`/api/download/${photo.id}`}
            download={photo.name}
            className="inline-flex items-center gap-2 bg-brass px-5 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-void transition-opacity hover:opacity-90"
          >
            ⬇ Download Original
          </a>
        </div>
      </div>
    </motion.div>
  );
}
