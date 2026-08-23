import { TRIP_CONFIG } from "@/lib/types";

export default function Footer() {
  return (
    <footer className="border-t border-hairline px-6 py-10 text-center">
      <p className="text-sm text-smoke">
        Made for the people who made the trip unforgettable. ❤️
      </p>
      <p className="mt-2 font-mono text-xs text-smoke-dim">© {TRIP_CONFIG.year} Trip Memories</p>
    </footer>
  );
}
