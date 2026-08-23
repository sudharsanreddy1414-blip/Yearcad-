import { NextRequest, NextResponse } from "next/server";
import convert from "heic-convert";
import { getFileMeta, getOriginalFileBuffer, getOriginalFileStream } from "@/lib/google-drive";

// Serves a photo inline for the lightbox's full-resolution view (as opposed
// to /api/download, which forces a save-as-file download of the untouched
// original). Most browsers — everything except Safari/iOS — cannot decode
// HEIC/HEIF, the format iPhones save photos in by default, so those files
// are converted to JPEG here before being sent. Every other format is
// streamed through unchanged at full original quality.
const HEIC_MIME_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

function isHeic(mimeType: string, name: string): boolean {
  return HEIC_MIME_TYPES.has(mimeType.toLowerCase()) || /\.hei[cf]$/i.test(name);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;

  try {
    const meta = await getFileMeta(fileId);

    if (isHeic(meta.mimeType, meta.name)) {
      const original = await getOriginalFileBuffer(fileId);
      const jpegBuffer = (await convert({
        buffer: original,
        format: "JPEG",
        quality: 0.92,
      })) as Buffer;

      return new NextResponse(new Uint8Array(jpegBuffer), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

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
