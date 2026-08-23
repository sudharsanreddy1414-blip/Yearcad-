import { NextResponse } from "next/server";
import { listPhotos } from "@/lib/google-drive";

// Revalidate the photo list every 60 seconds so newly added Drive photos
// show up without a redeploy or code change.
export const revalidate = 60;

export async function GET() {
  try {
    const photos = await listPhotos();
    return NextResponse.json(
      { photos, count: photos.length },
      { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/photos]", message);
    return NextResponse.json(
      {
        photos: [],
        count: 0,
        error:
          "Could not load photos from Google Drive. Check that GOOGLE_DRIVE_FOLDER_ID, " +
          "GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY are set, and that " +
          "the folder is shared with the service account email. Details: " +
          message,
      },
      { status: 500 }
    );
  }
}
