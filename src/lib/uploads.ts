import { mkdir, writeFile, unlink } from "fs/promises";
import { join, resolve } from "path";
import crypto from "crypto";

/**
 * Product photo storage.
 *
 * Files live OUTSIDE the app directory (Hostinger deploys wipe the app
 * folder — see DATABASE_URL pointing at db-data/ for the same reason).
 * UPLOAD_DIR defaults to ./uploads for local dev; production sets it to
 * the persistent path in hPanel env.
 */
export function uploadDir(): string {
  return process.env.UPLOAD_DIR || resolve(process.cwd(), "uploads");
}

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/** Validate a file part from FormData. Returns {ok, ext} or {ok:false, error}. */
export function validateImage(file: File): { ok: true; ext: string } | { ok: false; error: string } {
  if (!ALLOWED_TYPES[file.type]) {
    return { ok: false, error: "Photo must be a JPG, PNG, or WebP image." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Photo must be 5MB or smaller." };
  }
  return { ok: true, ext: ALLOWED_TYPES[file.type] };
}

/** Persist an uploaded image and return its public URL path. */
export async function saveImage(file: File): Promise<{ url: string } | { error: string }> {
  const check = validateImage(file);
  if (!check.ok) return { error: check.error };

  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  const filename = `${crypto.randomUUID()}.${check.ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, filename), buffer);
  return { url: `/api/uploads/${filename}` };
}

/** Delete an uploaded image file by its /api/uploads/... URL (best effort). */
export async function deleteImageByUrl(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl) return;
  const m = imageUrl.match(/^\/api\/uploads\/([a-zA-Z0-9-_.]+)$/);
  if (!m) return; // not one of ours — leave it alone
  try {
    await unlink(join(uploadDir(), m[1]));
  } catch {
    // file already gone — fine
  }
}
