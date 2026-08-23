import { NextRequest, NextResponse } from "next/server";
import { getOriginalFileStream } from "@/lib/google-drive";

// Serves the original file inline (for the lightbox's full-resolution view),
// as opposed to /api/download which forces a save-as-file download. Same
// underlying bytes — full quality either way — just a different
// Content-Disposition and long cache lifetime since a given Drive file id's
// bytes don't change for a fixed trip archive.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;

  try {
    const { stream, mimeType } = await getOriginalFileStream(fileId);

    const headers = new Headers({
      "Content-Type": mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    });

    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
        stream.on("end", () => controller.close());
        stream.on("error", (err) => controller.error(err));
      },
      cancel() {
        stream.destroy();
      },
    });

    return new NextResponse(webStream, { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/image]", message);
    return NextResponse.json(
      { error: "Could not load the original image from Google Drive.", details: message },
      { status: 500 }
    );
  }
}
