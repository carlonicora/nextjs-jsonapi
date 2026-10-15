import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

// The helper reads process.env when it builds the config, exactly as a real
// next.config.js does, so the env is fixed before the helper is imported.
const FIXED_ENV = vi.hoisted(() => {
  const env = {
    NEXT_PUBLIC_API_URL: "https://api.test",
    NEXT_PUBLIC_ADDRESS: "https://app.test",
    IMAGE_SOURCES: "https://img.test",
    NEXT_PUBLIC_CORPUS_URL: "https://corpus.test",
    APP_URL: "https://app.test",
  };
  for (const key of [
    "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
    "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
    "NEXT_PUBLIC_GTM_ID",
    "E2E_BUILD",
  ])
    delete process.env[key];
  Object.assign(process.env, env);
  return env;
});

import { buildCsp, createNextConfig, type NjaNextConfigOptions } from "../index";

type Pass = "production" | "e2e" | "development";
const PASSES: Record<Pass, Record<string, string | undefined>> = {
  production: { NODE_ENV: "production", E2E_BUILD: undefined },
  e2e: { NODE_ENV: "production", E2E_BUILD: "true" },
  development: { NODE_ENV: "development", E2E_BUILD: undefined },
};

type Json = unknown;

/** Turns a resolved config into a comparable tree: headers keyed by source and
 * header name, CSP parsed into directive -> sorted, de-duplicated sources
 * (source order and whitespace carry no meaning in CSP), functions as markers. */
function normalise(config: Record<string, unknown>): Record<string, Json> {
  const out: Record<string, Json> = JSON.parse(
    JSON.stringify(config, (key, v) => (typeof v === "function" ? `[Function ${v.name || key}]` : v)),
  );
  if (Array.isArray(out.headers)) {
    const headers: Record<string, Record<string, Json>> = {};
    for (const entry of out.headers as { source: string; headers: { key: string; value: string }[] }[]) {
      const byKey: Record<string, Json> = {};
      for (const { key, value } of entry.headers) {
        byKey[key] = key === "Content-Security-Policy" ? parseCsp(value) : value;
      }
      headers[entry.source] = byKey;
    }
    out.headers = headers;
  }
  return out;
}

function parseCsp(value: string): Record<string, string[]> {
  const directives: Record<string, string[]> = {};
  for (const part of value.split(";")) {
    const [name, ...sources] = part.trim().split(/\s+/).filter(Boolean);
    if (name) directives[name] = [...new Set(sources)].sort();
  }
  return directives;
}

function getPath(tree: Json, dotPath: string): Json {
  return dotPath.split(".").reduce<Json>((node, key) => (node as Record<string, Json> | undefined)?.[key], tree);
}

function stubPass(pass: Pass) {
  for (const [key, value] of Object.entries(PASSES[pass])) vi.stubEnv(key, value);
}

async function resolveHelper(options: NjaNextConfigOptions, pass: Pass): Promise<Record<string, Json>> {
  stubPass(pass);
  const config = createNextConfig(options) as Record<string, unknown>;
  const resolved: Record<string, unknown> = { ...config };
  if (typeof config.headers === "function") resolved.headers = await (config.headers as () => Promise<unknown>)();
  if (typeof config.rewrites === "function") resolved.rewrites = await (config.rewrites as () => Promise<unknown>)();
  return normalise(resolved);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createNextConfig: behaviour", () => {
  const base: NjaNextConfigOptions = { devOrigins: ["example.test"] };

  it("never requires a non-builtin module", () => {
    const dir = path.resolve(__dirname, "..");
    const files = readdirSync(dir).filter((f) => f.endsWith(".ts"));
    expect(files.sort()).toEqual(["csp.ts", "headers.ts", "index.ts"]);

    const offenders: string[] = [];
    for (const file of files) {
      const source = readFileSync(path.join(dir, file), "utf8");
      const statements = source.match(/^\s*(?:import|export)\b[^;]*?\bfrom\s*["'][^"']+["']/gm) ?? [];
      for (const statement of statements) {
        const specifier = statement.match(/["']([^"']+)["']$/)![1];
        const typeOnly = /^\s*(?:import|export)\s+type\b/.test(statement);
        if (specifier.startsWith("./") || specifier.startsWith("node:")) continue;
        if (specifier === "next" && typeOnly) continue;
        offenders.push(`${file}: ${statement.trim()}`);
      }
      for (const dynamic of source.match(/\b(?:require|import)\s*\(\s*["'][^"']+["']\s*\)/g) ?? []) {
        if (!/["'](?:\.\/|node:)/.test(dynamic)) offenders.push(`${file}: ${dynamic}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("sets the Next 16.4 flags every consumer gets, and nothing from the old config", () => {
    const config = createNextConfig(base) as Record<string, unknown>;
    expect(config.cacheComponents).toBe(true);
    expect(config.partialPrefetching).toBe(true);
    expect(config.poweredByHeader).toBe(false);
    expect(config.reactStrictMode).toBe(false);
    expect(config.reactCompiler).toBe(false);
    expect(config.turbopack).toEqual({ resolveAlias: { yjs: "./node_modules/yjs" } });
    expect(config.webpack).toBeUndefined();
    expect(config.experimental).toEqual(
      expect.objectContaining({
        authInterrupts: true,
        turbopackGc: true,
        serverActions: { bodySizeLimit: "5mb" },
      }),
    );
    expect(config.experimental).not.toHaveProperty("useCache");
    // Breaks client-side reads of this package in `next dev` (unactivated lazy import).
    expect(config.experimental).not.toHaveProperty("turbopackLazyDynamicImports");
  });

  it("derives pageExtensions, serverExternalPackages and images from the options and env", () => {
    const plain = createNextConfig(base) as Record<string, unknown>;
    expect(plain.pageExtensions).toEqual(["ts", "tsx"]);
    expect(plain.serverExternalPackages).toBeUndefined();
    expect(plain.allowedDevOrigins).toEqual(["example.test"]);
    expect(plain.images).toEqual({
      minimumCacheTTL: 60,
      remotePatterns: [
        { protocol: "https", hostname: "img.test" },
        { protocol: "https", hostname: "api.test" },
        { protocol: "https", hostname: "corpus.test" },
      ],
      dangerouslyAllowLocalIP: true,
    });

    const full = createNextConfig({ ...base, mdx: true, serwist: true, imageMinimumCacheTTL: 86400 }) as Record<
      string,
      unknown
    >;
    expect(full.pageExtensions).toEqual(["ts", "tsx", "mdx"]);
    expect(full.serverExternalPackages).toEqual(["esbuild", "esbuild-wasm"]);
    expect((full.images as { minimumCacheTTL: number }).minimumCacheTTL).toBe(86400);
  });

  it("omits HSTS and upgrade-insecure-requests when E2E_BUILD=true", async () => {
    const e2e = await resolveHelper(base, "e2e");
    const e2eHeaders = getPath(e2e, "headers./:path*") as Record<string, Json>;
    expect(e2eHeaders["Strict-Transport-Security"]).toBeUndefined();
    expect(e2eHeaders["Content-Security-Policy"]).not.toHaveProperty("upgrade-insecure-requests");
    expect(e2e.distDir).toBe(".next-e2e");

    const production = await resolveHelper(base, "production");
    const productionHeaders = getPath(production, "headers./:path*") as Record<string, Json>;
    expect(productionHeaders["Strict-Transport-Security"]).toBe("max-age=31536000; includeSubDomains");
    expect(productionHeaders["Content-Security-Policy"]).toHaveProperty("upgrade-insecure-requests");
    expect(production.distDir).toBeUndefined();
  });

  it("lets the optimizer fetch from the api and corpus origins, skipping unset and duplicate ones", () => {
    vi.stubEnv("NEXT_PUBLIC_CORPUS_URL", undefined);
    vi.stubEnv("IMAGE_SOURCES", "https://img.test,https://api.test");
    const config = createNextConfig(base) as { images: { remotePatterns: unknown[] } };
    expect(config.images.remotePatterns).toEqual([
      { protocol: "https", hostname: "img.test" },
      { protocol: "https", hostname: "api.test" },
    ]);
  });

  it("reactCompiler option sets both reactCompiler and turbopackRustReactCompiler", () => {
    const on = createNextConfig({ ...base, reactCompiler: true });
    expect(on.reactCompiler).toBe(true);
    expect(on.experimental?.turbopackRustReactCompiler).toBe(true);

    const off = createNextConfig(base);
    expect(off.reactCompiler).toBe(false);
    expect(off.experimental?.turbopackRustReactCompiler).toBeUndefined();
  });

  it("securityHeaders:false returns no headers()", () => {
    expect(createNextConfig({ ...base, securityHeaders: false }).headers).toBeUndefined();
    expect(typeof createNextConfig(base).headers).toBe("function");
  });

  it("applies extend last, to the finished config", () => {
    const extend = vi.fn((config) => ({ ...config, output: "standalone" as const }));
    const config = createNextConfig({ ...base, extend });
    expect(extend).toHaveBeenCalledWith(expect.objectContaining({ cacheComponents: true }));
    expect(config.output).toBe("standalone");
  });
});

describe("buildCsp", () => {
  const env = { ...FIXED_ENV, NODE_ENV: "production" } as unknown as NodeJS.ProcessEnv;

  it("allows no third-party host unless a service names it", () => {
    const csp = parseCsp(buildCsp({}, env));
    expect(csp["script-src"]).toEqual(["'self'", "'unsafe-eval'", "'unsafe-inline'"]);
    expect(csp["style-src"]).toEqual(["'self'", "'unsafe-inline'"]);
    expect(csp["font-src"]).toEqual(["'self'"]);
    expect(csp["frame-src"]).toEqual(["'self'", "https://api.test", "https://corpus.test"]);
    expect(csp["worker-src"]).toEqual(["'self'", "blob:"]);
    expect(buildCsp({}, env)).not.toMatch(/stripe|google|cloudflare|discord/);
  });

  it("adds each named service's hosts to the directives it needs", () => {
    const all = parseCsp(buildCsp({ services: ["stripe", "googleMaps", "turnstile", "discord", "googleFonts"] }, env));
    expect(all["script-src"]).toEqual(
      expect.arrayContaining([
        "https://js.stripe.com",
        "https://maps.googleapis.com",
        "https://challenges.cloudflare.com",
      ]),
    );
    expect(all["img-src"]).toEqual(
      expect.arrayContaining([
        "https://*.stripe.com",
        "https://maps.googleapis.com",
        "https://maps.gstatic.com",
        "https://cdn.discordapp.com",
      ]),
    );
    expect(all["connect-src"]).toEqual(
      expect.arrayContaining([
        "https://api.stripe.com",
        "https://maps.googleapis.com",
        "https://places.googleapis.com",
        "https://challenges.cloudflare.com",
      ]),
    );
    expect(all["frame-src"]).toEqual(
      expect.arrayContaining([
        "https://js.stripe.com",
        "https://hooks.stripe.com",
        "https://challenges.cloudflare.com",
      ]),
    );
    expect(all["style-src"]).toContain("https://fonts.googleapis.com");
    expect(all["font-src"]).toContain("https://fonts.gstatic.com");

    const stripeOnly = buildCsp({ services: ["stripe"] }, env);
    expect(stripeOnly).toContain("https://js.stripe.com");
    expect(stripeOnly).not.toMatch(/google|cloudflare|discord/);
  });

  it("appends extra sources per directive after the services", () => {
    const csp = parseCsp(buildCsp({ services: ["stripe"], csp: { "frame-src": ["https://docs.google.com/"] } }, env));
    expect(csp["frame-src"]).toEqual([
      "'self'",
      "https://api.test",
      "https://corpus.test",
      "https://docs.google.com/",
      "https://hooks.stripe.com",
      "https://js.stripe.com",
    ]);
  });

  it("derives API, websocket, address and image sources from the env", () => {
    const csp = parseCsp(buildCsp({}, env));
    expect(csp["connect-src"]).toEqual(
      expect.arrayContaining(["https://api.test", "wss://api.test", "https://app.test", "https://img.test"]),
    );
    expect(csp["img-src"]).toContain("https://img.test");
  });

  it("allows images and frames from the api and corpus origins", () => {
    const csp = parseCsp(buildCsp({}, env));
    for (const directive of ["img-src", "frame-src"]) {
      expect(csp[directive]).toEqual(expect.arrayContaining(["https://api.test", "https://corpus.test"]));
    }
  });

  it("lists the api and corpus origins once, and nothing for an unset corpus", () => {
    const value = buildCsp({}, {
      NODE_ENV: "production",
      NEXT_PUBLIC_API_URL: "https://api.test/",
      IMAGE_SOURCES: "https://api.test",
    } as unknown as NodeJS.ProcessEnv);
    for (const directive of ["img-src", "frame-src"]) {
      const sources = value
        .split(";")
        .map((part) => part.trim().split(/\s+/))
        .find(([name]) => name === directive)!
        .slice(1);
      expect(sources.filter((source) => source === "https://api.test")).toHaveLength(1);
      expect(sources.join(" ")).not.toContain("corpus");
      expect(sources).not.toContain("");
    }
    expect(value).not.toMatch(/\s{2,}/);
  });

  it("drops empty sources when env values are missing", () => {
    const value = buildCsp({ csp: { "img-src": [""] } }, { NODE_ENV: "development" } as unknown as NodeJS.ProcessEnv);
    expect(value).not.toMatch(/\s{2,}/);
    expect(value).not.toMatch(/ ;/);
    expect(value).not.toContain("upgrade-insecure-requests");
  });
});
