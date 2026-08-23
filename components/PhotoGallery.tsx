"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import GalleryControls, { SortOrder, ViewMode } from "./GalleryControls";
import PhotoCard from "./PhotoCard";
import PhotoLightbox from "./PhotoLightbox";
import type { Photo } from "@/lib/types";

const PAGE_SIZE = 30;
const REVALIDATE_INTERVAL_MS = 90_000;

export default function PhotoGallery({ initialPhotos }: { initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [view, setView] = useState<ViewMode>("masonry");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Periodically re-check Drive so newly added photos appear without a
  // manual refresh or redeploy.
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/photos", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.photos) && data.photos.length) {
          setPhotos(data.photos);
        }
      } catch {
        // Silently ignore — next interval will retry.
      }
    }, REVALIDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q ? photos.filter((p) => p.name.toLowerCase().includes(q)) : photos;
    list = [...list].sort((a, b) => {
      const at = new Date(a.createdTime).getTime();
      const bt = new Date(b.createdTime).getTime();
      return sort === "newest" ? bt - at : at - bt;
    });
    return list;
  }, [photos, query, sort]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <section id="gallery" className="mx-auto max-w-[1600px] py-16 sm:py-24">
      <div className="mx-auto mb-10 max-w-2xl px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">The Gallery</p>
        <h2 className="mt-3 font-display text-3xl text-ivory sm:text-4xl">Every Frame</h2>
      </div>

      <GalleryControls
        query={query}
        onQueryChange={(v) => {
          setQuery(v);
          setVisibleCount(PAGE_SIZE);
        }}
        sort={sort}
        onSortChange={setSort}
        view={view}
        onViewChange={setView}
        resultCount={filtered.length}
      />

      {filtered.length === 0 ? (
        <p className="px-6 py-24 text-center font-mono text-sm text-smoke-dim">
          No photos match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className={`px-3 sm:px-6 ${view === "masonry" ? "masonry" : "grid-uniform"}`}>
          {visible.map((photo, i) => (
            <PhotoCard key={photo.id} photo={photo} index={i} onOpen={setLightboxIndex} />
          ))}
        </div>
      )}

      {visibleCount < filtered.length && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="border border-hairline px-8 py-3 font-mono text-xs uppercase tracking-[0.2em] text-ivory transition-colors hover:border-brass hover:text-brass"
          >
            Load More
          </button>
        </div>
      )}

      <AnimatePresence>
        {lightboxIndex !== null && (
          <PhotoLightbox
            photos={filtered}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
