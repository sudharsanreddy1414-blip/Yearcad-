import Hero from "@/components/Hero";
import PhotoGallery from "@/components/PhotoGallery";
import ShareSection from "@/components/ShareSection";
import Footer from "@/components/Footer";
import { listPhotos } from "@/lib/google-drive";
import type { Photo } from "@/lib/types";

// Revalidate the page itself every 60s so a fresh server render can pick up
// newly added Drive photos even before any client poll fires.
export const revalidate = 60;

async function getInitialPhotos(): Promise<{ photos: Photo[]; error: string | null }> {
  try {
    const photos = await listPhotos();
    return { photos, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { photos: [], error: message };
  }
}

export default async function Home() {
  const { photos, error } = await getInitialPhotos();

  return (
    <main className="flex-1">
      <Hero photoCount={photos.length} coverPhoto={photos[0]} />

      {error ? (
        <section id="gallery" className="mx-auto max-w-2xl px-6 py-32 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">
            Setup required
          </p>
          <h2 className="mt-4 font-display text-2xl text-ivory">
            The gallery can&apos;t reach Google Drive yet
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-smoke">
            Add your Drive service account credentials to <code className="text-ivory">.env.local</code>{" "}
            and share the trip folder with the service account&apos;s email as a Viewer. See the
            README for the exact steps.
          </p>
        </section>
      ) : (
        <PhotoGallery initialPhotos={photos} />
      )}

      <ShareSection />
      <Footer />
    </main>
  );
}
