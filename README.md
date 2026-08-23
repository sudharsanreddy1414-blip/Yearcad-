# Trip Memories — Private Photo Gallery

A premium, dark, cinematic photo gallery for sharing trip photos with friends, backed live by a
Google Drive folder. Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Framer Motion.

---

## 1. Architecture

```
app/
  page.tsx                     Server component — fetches photos from Drive at request/revalidate time
  layout.tsx                   Root layout, metadata
  globals.css                  Design tokens (colors, fonts), masonry/grid CSS, skeleton animation
  api/
    photos/route.ts            GET — lists all image files in the Drive folder (revalidates every 60s)
    image/[fileId]/route.ts    GET — streams the ORIGINAL file inline, for the lightbox full view
    download/[fileId]/route.ts GET — streams the ORIGINAL file as a forced attachment download

components/
  Hero.tsx                     Cinematic hero: title, subtitle, photo count, cover image, CTA
  PhotoGallery.tsx             Client state: search/sort/view, pagination, polling, lightbox wiring
  PhotoCard.tsx                Single grid tile: skeleton → thumbnail, hover zoom + filename overlay
  PhotoLightbox.tsx            Full-screen viewer: swipe, keyboard nav, counter, download button
  GalleryControls.tsx          Search box, sort select, grid/masonry toggle
  ShareSection.tsx             Web Share API button
  Footer.tsx                   Footer

lib/
  google-drive.ts              All server-only Drive API logic (auth, listing, original-file streaming)
  types.ts                     Shared Photo type + TRIP_CONFIG (title/subtitle/location — edit this)
```

Nothing about Drive credentials ever reaches the browser: `lib/google-drive.ts` is only imported
from Server Components and Route Handlers (both server-only), and the private key never appears
in any client bundle.

## 2. How photo data flows

1. `lib/google-drive.ts` authenticates as a **Google Cloud service account** and queries the Drive
   `files.list` endpoint for `'<folder>' in parents and mimeType contains 'image/'`, paginating
   through all results, ordered newest-first.
2. The **grid** uses Drive's own `thumbnailLink` (bumped to `=s1200`) directly as the `<img src>` —
   this is fast, Google-hosted, and costs your server no bandwidth for browsing.
3. Clicking a photo opens the **lightbox**, which loads `/api/image/[fileId]` — this route calls
   `files.get({ alt: "media" })` and streams the **original file bytes**, not a re-encoded preview.
4. **Download** uses `/api/download/[fileId]` — identical original-bytes stream, but with a
   `Content-Disposition: attachment; filename="<original name>"` header so the browser saves the
   real file, under its real name, at full quality. The thumbnail is never what gets downloaded.
5. `/api/photos` (and the page itself) revalidate every 60 seconds, and the gallery additionally
   polls `/api/photos` every 90 seconds client-side — so photos you add to the Drive folder later
   show up on their own, no redeploy needed.

## 3. Google Drive setup (required)

I was not able to inspect your Drive folder directly — fetching
`https://drive.google.com/drive/folders/1oY-nU_R7mN9HywOffk2w4gjRJaqKUPDW` redirected to a Google
sign-in page, which means it isn't currently viewable without authentication. The app is built to
work either way, but you need to do one of the following:

### Option A — Service account (recommended, used by this code as-is)

1. **Google Cloud Console** → create/select a project → **APIs & Services → Library** → enable
   **Google Drive API**.
2. **APIs & Services → Credentials → Create Credentials → Service Account.** Give it any name
   (e.g. `trip-gallery-reader`). No special roles needed.
3. Open the new service account → **Keys → Add Key → Create new key → JSON**. This downloads a
   `.json` file — keep it private, never commit it.
4. Open that JSON file. Copy:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (keep the `\n` sequences literal, wrap
     the whole value in quotes)
5. **Share the Drive folder** with that service account: open the folder in Drive → **Share** →
   paste the `client_email` address → role **Viewer** → Send.
6. Set `GOOGLE_DRIVE_FOLDER_ID` to `1oY-nU_R7mN9HywOffk2w4gjRJaqKUPDW` (already the default in
   `.env.example`).

### Option B — "Anyone with the link" viewer sharing

Sharing the folder publicly as **Viewer** does not, by itself, give a clean API for listing files
and streaming true-original bytes for arbitrary visitors — Option A is more reliable and is what
this codebase implements. If you'd rather not use a service account, say so and I can wire up a
public API-key-only variant instead (with the tradeoff that "download original" becomes a plain
link to Drive's own export/download URL rather than a fully white-labeled file stream).

## 4. Environment variables

Copy `.env.example` to `.env.local` (same folder as `package.json`) and fill in the three values:

```
GOOGLE_DRIVE_FOLDER_ID=1oY-nU_R7mN9HywOffk2w4gjRJaqKUPDW
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

`.env.local` is already covered by `.gitignore` — it will not be committed.

## 5. Run it locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. Until the env vars above are set correctly, the page renders a
"Setup required" panel instead of a broken gallery.

## 6. Adding more photos later

Just drop more image files into the same Drive folder. No code changes, no redeploy — the page
revalidates every 60s server-side, and the browser gallery re-checks every 90s. Filenames,
thumbnails, and full-quality downloads all work automatically for anything added.

## 7. Customizing the trip details

Edit `lib/types.ts` → `TRIP_CONFIG`:

```ts
export const TRIP_CONFIG = {
  title: "OUR TRIP MEMORIES",
  subtitle: "Every journey. Every laugh. Every unforgettable moment.",
  location: "Kyoto, Japan",          // shown in the hero
  description: "…",
  year: new Date().getFullYear(),
};
```

## 8. Deploying on Vercel

1. Push this project to a GitHub repo.
2. In Vercel: **New Project → import the repo.** Framework preset auto-detects Next.js.
3. Before the first deploy (or in **Project → Settings → Environment Variables** any time),
   add the same three variables from `.env.local` — set them for **Production**, **Preview**, and
   **Development** as needed. Paste the private key exactly as it appears in `.env.local`,
   including the `\n` escapes and surrounding quotes.
4. Deploy. Vercel builds with `next build` automatically — no extra config needed.
5. To add photos later, just add them to the Drive folder — no redeploy required.

## 9. Design

Dark/charcoal/ivory/brass palette, a serif display face for headings and a monospace face for
"film frame" style metadata (counters, labels), CSS-column masonry that preserves each photo's
real aspect ratio, and a lightbox styled like a projector booth (frame counter, sprocket-hole
accents in the hero). All animation respects `prefers-reduced-motion`.

## 10. Build status

`npm run lint` → 0 errors. `npm run build` → succeeds (verified in this environment without live
Drive credentials — the API routes are exercised at build time and fail over to the graceful
"Setup required" state exactly as they will if you deploy before adding your credentials).
