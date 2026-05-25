import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHelpAssetRouteHandler } from "../createHelpAssetRouteHandler";

describe("createHelpAssetRouteHandler", () => {
  let srcRoot: string;

  beforeAll(async () => {
    srcRoot = await mkdtemp(join(tmpdir(), "help-assets-"));
    await mkdir(srcRoot, { recursive: true });
    await writeFile(join(srcRoot, "ok.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  });
  afterAll(async () => {
    await rm(srcRoot, { recursive: true, force: true });
  });

  it("returns 200 with correct MIME for an existing PNG", async () => {
    const GET = createHelpAssetRouteHandler({ srcRoot });
    const res = await GET(new Request("http://localhost/help-assets/ok.png"), {
      params: Promise.resolve({ path: ["ok.png"] }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
  });

  it("returns 404 for missing files", async () => {
    const GET = createHelpAssetRouteHandler({ srcRoot });
    const res = await GET(new Request("http://localhost/help-assets/missing.png"), {
      params: Promise.resolve({ path: ["missing.png"] }),
    });
    expect(res.status).toBe(404);
  });

  it("sanitizes path traversal attempts", async () => {
    const GET = createHelpAssetRouteHandler({ srcRoot });
    const res = await GET(new Request("http://localhost/help-assets/etc/passwd"), {
      params: Promise.resolve({ path: ["..", "..", "etc", "passwd"] }),
    });
    expect(res.status).toBe(404);
  });
});
