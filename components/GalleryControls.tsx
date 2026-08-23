"use client";

export type SortOrder = "newest" | "oldest";
export type ViewMode = "masonry" | "grid";

export default function GalleryControls({
  query,
  onQueryChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  resultCount,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  sort: SortOrder;
  onSortChange: (v: SortOrder) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  resultCount: number;
}) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 pb-8 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search photos by filename…"
          className="w-full border border-hairline bg-charcoal px-4 py-2.5 text-sm text-ivory placeholder:text-smoke-dim focus:border-brass focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-4">
        <span className="font-mono text-xs uppercase tracking-[0.15em] text-smoke-dim">
          {resultCount} {resultCount === 1 ? "photo" : "photos"}
        </span>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOrder)}
          className="border border-hairline bg-charcoal px-3 py-2 text-sm text-ivory focus:border-brass focus:outline-none"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>

        <div className="flex border border-hairline">
          <button
            type="button"
            onClick={() => onViewChange("masonry")}
            aria-pressed={view === "masonry"}
            className={`px-3 py-2 text-xs font-mono uppercase tracking-[0.15em] transition-colors ${
              view === "masonry" ? "bg-brass text-void" : "text-smoke hover:text-ivory"
            }`}
          >
            Masonry
          </button>
          <button
            type="button"
            onClick={() => onViewChange("grid")}
            aria-pressed={view === "grid"}
            className={`px-3 py-2 text-xs font-mono uppercase tracking-[0.15em] transition-colors ${
              view === "grid" ? "bg-brass text-void" : "text-smoke hover:text-ivory"
            }`}
          >
            Grid
          </button>
        </div>
      </div>
    </div>
  );
}
