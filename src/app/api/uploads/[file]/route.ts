import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { uploadDir } from "@/lib/uploads";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Serve uploaded product photos from the persistent uploads dir. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;

  // Only our generated filenames — no path traversal, no dotfiles
  if (!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(file)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buf = await readFile(join(uploadDir(), file));
    const ext = file.split(".").pop() || "jpg";
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
