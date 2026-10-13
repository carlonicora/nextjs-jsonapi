// Shared next.config for the nja fleet. Apps wrap the result with their own
// plugins: `withNextIntl(withMDX(createNextConfig({...})))`.
//
// next.config.js is loaded at RUNTIME by `next start`, and the production image
// installs with --prod. This entry may therefore import only Node built-ins at
// runtime: never next-intl, @next/mdx, serwist or any devDependency. `next` is
// imported for its types only.
import type { NextConfig } from "next";
import { buildCsp, type CspDirective, type CspService } from "./csp";
import { buildSecurityHeaders } from "./headers";

export { buildCsp };
export type { CspDirective, CspService };

export interface NjaNextConfigOptions {
  devOrigins: string[];
  /** Third-party services the app loads; each adds its own hosts to the CSP. Nothing is allowed by default. */
  services?: CspService[];
  /** Extra CSP sources per directive, for hosts no named service covers. */
  csp?: Partial<Record<CspDirective, string[]>>;
  env?: Record<string, string>;
  imageMinimumCacheTTL?: number;
  permissionsPolicy?: { camera?: "none" | "self" };
  mdx?: boolean;
  serwist?: boolean;
  securityHeaders?: boolean;
  authInterrupts?: boolean;
  reactCompiler?: boolean;
  rewrites?: NextConfig["rewrites"];
  extend?: (config: NextConfig) => NextConfig;
}

type RemotePattern = { protocol: "http" | "https"; hostname: string; port?: string };

function parseImageSources(env: NodeJS.ProcessEnv): RemotePattern[] {
  return env.IMAGE_SOURCES
    ? env.IMAGE_SOURCES.split(",").map((url) => {
        const { hostname, protocol, port } = new URL(url.trim());
        return {
          protocol: protocol.replace(":", "") as RemotePattern["protocol"],
          hostname,
          port: port || undefined,
        };
      })
    : [];
}

export function createNextConfig(options: NjaNextConfigOptions): NextConfig {
  const env = process.env;
  const reactCompiler = options.reactCompiler === true;

  const config: NextConfig = {
    // The e2e stack (scripts/e2e.sh) runs a PRODUCTION build of this app while a
    // `next dev` server may still be running against the same worktree. `next
    // build` and `next dev` share `.next`, so a build performed underneath a live
    // dev server clobbers it and that dev server then 404s every route. Giving
    // the e2e build its own directory keeps the two independent. E2E_BUILD must
    // be set for `next build` AND for `next start`, or `start` looks in `.next`
    // and serves someone else's output.
    ...(env.E2E_BUILD === "true" ? { distDir: ".next-e2e" } : {}),
    cacheComponents: true,
    partialPrefetching: true,
    reactCompiler,
    experimental: {
      serverActions: {
        bodySizeLimit: "5mb",
      },
      // Required by `unauthorized()` (next/navigation), which ServerSession.checkPermission
      // calls to deny access. Without this flag the function throws a plain Error instead of
      // rendering the nearest unauthorized.tsx.
      authInterrupts: options.authInterrupts ?? true,
      turbopackGc: true,
      turbopackLazyDynamicImports: true,
      ...(reactCompiler ? { turbopackRustReactCompiler: true } : {}),
    },
    allowedDevOrigins: options.devOrigins,
    pageExtensions: options.mdx ? ["ts", "tsx", "mdx"] : ["ts", "tsx"],
    images: {
      minimumCacheTTL: options.imageMinimumCacheTTL ?? 60,
      remotePatterns: parseImageSources(env),
      dangerouslyAllowLocalIP: true,
    },
    poweredByHeader: false,
    reactStrictMode: false,
    env: {
      NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL ?? "",
      NEXT_PUBLIC_ADDRESS: env.NEXT_PUBLIC_ADDRESS ?? "",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
      ...options.env,
    },
    // Inlined replacement for @serwist/turbopack's withSerwist wrapper, which
    // does nothing but append these two entries. Requiring the package here
    // instead CRASHES production: it is a devDependency, next.config.js is loaded
    // at RUNTIME by `next start`, and the web-production image installs with
    // --prod. Do not re-add a require of any devDependency to this file.
    ...(options.serwist ? { serverExternalPackages: ["esbuild", "esbuild-wasm"] } : {}),
    // Next 16 builds AND serves dev with Turbopack, so this is what pins yjs to a
    // single instance in both modes.
    turbopack: {
      resolveAlias: {
        yjs: "./node_modules/yjs",
      },
    },
  };

  if (options.securityHeaders !== false) {
    config.headers = async () => buildSecurityHeaders(options, process.env);
  }

  if (options.rewrites) config.rewrites = options.rewrites;

  return options.extend ? options.extend(config) : config;
}
