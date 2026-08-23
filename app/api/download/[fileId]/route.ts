import { NextRequest, NextResponse } from "next/server";
import { getOriginalFileStream } from "@/lib/google-drive";

// Streams the true original file from Drive (alt=media), never the
// thumbnail, and forces a browser download via Content-Disposition so the
// original filename and extension are preserved.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;

  try {
    const { stream, mimeType, name, size } = await getOriginalFileStream(fileId);

    const headers = new Headers({
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(name)}"`,
    });
    if (size) headers.set("Content-Length", size);

    // Web Streams / Node stream bridge for the Response body.
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
    console.error("[/api/download]", message);
    return NextResponse.json(
      { error: "Could not download the original file from Google Drive.", details: message },
      { status: 500 }
    );
  }
}
