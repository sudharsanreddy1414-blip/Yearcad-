import { google, drive_v3 } from "googleapis";
import { Readable } from "node:stream";

/**
 * Server-only Google Drive integration.
 *
 * Auth: a Google Cloud service account (JSON key), supplied via env vars.
 * The service account must be added as a Viewer on the target Drive folder
 * (or the folder must be shared with "Anyone with the link" as Viewer, in
 * which case an API key alone would also work — but a service account is
 * used here because it also unlocks the original-quality download flow,
 * which anonymous API-key access does not reliably provide for binary
 * content on files owned by someone else).
 *
 * Required env vars (see .env.example):
 *   GOOGLE_DRIVE_FOLDER_ID
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
 */

const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];

export interface DrivePhoto {
  id: string;
  name: string;
  mimeType: string;
  /** ISO timestamp Drive reports for the file (createdTime). */
  createdTime: string;
  /** Original byte size reported by Drive, as a string (Drive returns int64 as string). */
  size?: string;
  /** Width/height in pixels if Drive was able to determine them (images only). */
  imageWidth?: number;
  imageHeight?: number;
  /** A Drive-hosted preview thumbnail — NOT the download source, browsing only. */
  thumbnailUrl?: string;
}

let cachedClient: drive_v3.Drive | null = null;

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example for setup instructions.`
    );
  }
  return value;
}

function getDriveClient(): drive_v3.Drive {
  if (cachedClient) return cachedClient;

  const clientEmail = getEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  // Private keys are usually stored in env files with literal "\n" sequences
  // instead of real newlines — normalize that here.
  const privateKey = getEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY").replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });

  cachedClient = google.drive({ version: "v3", auth });
  return cachedClient;
}

const IMAGE_MIME_PREFIX = "image/";

/**
 * Lists every image file in the configured Drive folder, newest first.
 * Only image/* mime types are returned — documents, videos, folders, etc.
 * are filtered out server-side via the Drive query itself.
 */
export async function listPhotos(): Promise<DrivePhoto[]> {
  const drive = getDriveClient();
  const folderId = getEnv("GOOGLE_DRIVE_FOLDER_ID");

  const photos: DrivePhoto[] = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields:
        "nextPageToken, files(id, name, mimeType, createdTime, size, imageMediaMetadata(width,height), thumbnailLink)",
      orderBy: "createdTime desc",
      pageSize: 200,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    for (const file of res.data.files ?? []) {
      if (!file.id || !file.name || !file.mimeType?.startsWith(IMAGE_MIME_PREFIX)) continue;
      photos.push({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        createdTime: file.createdTime ?? new Date().toISOString(),
        size: file.size ?? undefined,
        imageWidth: file.imageMediaMetadata?.width ?? undefined,
        imageHeight: file.imageMediaMetadata?.height ?? undefined,
        // thumbnailLink defaults to a small size — we request a larger
        // render for the gallery grid by tweaking the sz= param.
        thumbnailUrl: file.thumbnailLink
          ? file.thumbnailLink.replace(/=s\d+$/, "=s1200")
          : undefined,
      });
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return photos;
}

/**
 * Lightweight metadata-only fetch (no bytes) — used to decide how to serve
 * a file (e.g. whether it needs HEIC→JPEG conversion) before paying for a
 * full download.
 */
export async function getFileMeta(
  fileId: string
): Promise<{ name: string; mimeType: string; size?: string }> {
  const drive = getDriveClient();
  const res = await drive.files.get({
    fileId,
    fields: "name, mimeType, size",
    supportsAllDrives: true,
  });
  return {
    name: res.data.name ?? fileId,
    mimeType: res.data.mimeType ?? "application/octet-stream",
    size: res.data.size ?? undefined,
  };
}

/**
 * Fetches the ORIGINAL file fully into memory. Used only when the bytes
 * need to be transformed server-side (HEIC→JPEG conversion) before they
 * can be sent to the browser — the download endpoint still streams the
 * untouched original instead of using this.
 */
export async function getOriginalFileBuffer(fileId: string): Promise<Buffer> {
  const drive = getDriveClient();
  const res = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(res.data as ArrayBuffer);
}

/**
 * Streams the ORIGINAL file bytes for a given Drive file id — this is the
 * true source file, not a thumbnail or a re-encoded preview. Used by both
 * the full-resolution lightbox view and the download endpoint.
 */
export async function getOriginalFileStream(fileId: string): Promise<{
  stream: Readable;
  mimeType: string;
  name: string;
  size?: string;
}> {
  const drive = getDriveClient();

  const meta = await drive.files.get({
    fileId,
    fields: "name, mimeType, size",
    supportsAllDrives: true,
  });

  const res = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "stream" }
  );

  return {
    stream: res.data as unknown as Readable,
    mimeType: meta.data.mimeType ?? "application/octet-stream",
    name: meta.data.name ?? fileId,
    size: meta.data.size ?? undefined,
  };
}
