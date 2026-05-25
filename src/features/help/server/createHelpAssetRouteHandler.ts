import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export function createHelpAssetRouteHandler({ srcRoot }: { srcRoot: string }) {
  return async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    const safe = path.filter((p) => p !== ".." && !p.includes("/")).join("/");
    const filePath = join(srcRoot, safe);
    try {
      const s = await stat(filePath);
      if (!s.isFile()) return new NextResponse("Not found", { status: 404 });
      const ext = filePath.toLowerCase().slice(filePath.lastIndexOf("."));
      const mime = MIME[ext] ?? "application/octet-stream";
      const data = await readFile(filePath);
      return new NextResponse(data, {
        status: 200,
        headers: { "Content-Type": mime, "Cache-Control": "public, max-age=3600" },
      });
    } catch {
      return new NextResponse("Not found", { status: 404 });
    }
  };
}
