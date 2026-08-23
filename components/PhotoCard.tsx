"use client";

import { useState } from "react";
import type { Photo } from "@/lib/types";

export default function PhotoCard({
  photo,
  index,
  onOpen,
}: {
  photo: Photo;
  index: number;
  onOpen: (index: number) => void;
}) {
  const [loaded, setLoaded] = useState(false);

  const aspect =
    photo.imageWidth && photo.imageHeight ? photo.imageWidth / photo.imageHeight : 4 / 3;

  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className="group relative block w-full overflow-hidden bg-charcoal text-left"
      style={{ aspectRatio: aspect }}
    >
      {!loaded && <div className="skeleton absolute inset-0" />}
      {photo.thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.thumbnailUrl}
          alt={photo.name}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-cover transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.04] ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/70 via-void/0 to-void/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <p className="truncate font-mono text-[11px] tracking-wide text-ivory">{photo.name}</p>
        <p className="font-mono text-[10px] text-brass">
          {String(index + 1).padStart(3, "0")}
        </p>
      </div>
    </button>
  );
}
