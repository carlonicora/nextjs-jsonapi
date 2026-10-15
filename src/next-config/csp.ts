// Runtime imports: none. next.config.js loads this at RUNTIME under `next start`
// in an image installed with --prod, so it may import only Node built-ins.

export type CspDirective =
  "script-src" | "style-src" | "img-src" | "font-src" | "connect-src" | "frame-src" | "worker-src";

/**
 * Third-party services an app may load. Each one adds its hosts to the
 * directives it needs; nothing is allowed unless the app names it.
 *
 * - `stripe`: the billing feature (`@carlonicora/nextjs-jsonapi/billing`).
 * - `googleMaps`: `FormPlaceAutocomplete` (Places API) and Maps JS/static tiles.
 * - `turnstile`: Cloudflare Turnstile widgets (contact and waitlist forms).
 * - `discord`: Discord avatars shown for users who log in with Discord.
 * - `googleFonts`: fonts linked at runtime from Google Fonts. Not needed for
 *   `next/font/google`, which self-hosts at build time.
 */
export type CspService = "stripe" | "googleMaps" | "turnstile" | "discord" | "googleFonts";

export interface CspOptions {
  services?: CspService[];
  csp?: Partial<Record<CspDirective, string[]>>;
}

const SERVICE_SOURCES: Record<CspService, Partial<Record<CspDirective, string[]>>> = {
  stripe: {
    "script-src": ["https://js.stripe.com"],
    "img-src": ["https://*.stripe.com"],
    "connect-src": ["https://api.stripe.com"],
    "frame-src": ["https://js.stripe.com", "https://hooks.stripe.com"],
  },
  googleMaps: {
    "script-src": ["https://maps.googleapis.com"],
    "img-src": ["https://maps.googleapis.com", "https://maps.gstatic.com"],
    "connect-src": ["https://maps.googleapis.com", "https://places.googleapis.com"],
  },
  turnstile: {
    "script-src": ["https://challenges.cloudflare.com"],
    "connect-src": ["https://challenges.cloudflare.com"],
    "frame-src": ["https://challenges.cloudflare.com"],
  },
  discord: {
    "img-src": ["https://cdn.discordapp.com"],
  },
  googleFonts: {
    "style-src": ["https://fonts.googleapis.com"],
    "font-src": ["https://fonts.gstatic.com"],
  },
};

function listImageSources(env: NodeJS.ProcessEnv): string[] {
  return env.IMAGE_SOURCES ? env.IMAGE_SOURCES.split(",").map((s) => s.trim()) : [];
}

/**
 * Origins of the app's own servers, the API and the corpus, from
 * `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_CORPUS_URL`. They serve every stored
 * object link, so images and frames must be allowed from them. Unset or invalid
 * URLs are skipped; the result has no duplicates.
 */
export function listAppOrigins(env: NodeJS.ProcessEnv): string[] {
  const origins: string[] = [];
  for (const url of [env.NEXT_PUBLIC_API_URL, env.NEXT_PUBLIC_CORPUS_URL]) {
    if (!url) continue;
    try {
      const { origin } = new URL(url.trim());
      if (origin !== "null" && !origins.includes(origin)) origins.push(origin);
    } catch {
      // Not a URL: nothing to allow.
    }
  }
  return origins;
}

// Build CSP directives
// Note: 'unsafe-inline' and 'unsafe-eval' needed for Next.js dev mode and some runtime features
// In production, consider using nonces for stricter CSP
export function buildCsp(options: CspOptions, env: NodeJS.ProcessEnv): string {
  const apiUrl = env.NEXT_PUBLIC_API_URL || "";
  const imageSources = listImageSources(env);
  const appOrigins = listAppOrigins(env);
  const services = options.services ?? [];

  // Each fetch directive: what Next itself needs, then the named services, then
  // the app's extras, then the sources derived from the env.
  const fetchDirectives: Record<CspDirective, { base: string[]; fromEnv: string[] }> = {
    // Scripts: self, and unsafe-inline/eval for Next.js
    "script-src": { base: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], fromEnv: [] },
    // Styles: self and unsafe-inline for styled-components/emotion
    "style-src": { base: ["'self'", "'unsafe-inline'"], fromEnv: [] },
    // Images: self, data URIs, blobs, configured image sources, and the api/corpus origins
    "img-src": { base: ["'self'", "data:", "blob:"], fromEnv: [...imageSources, ...appOrigins] },
    // Fonts: self
    "font-src": { base: ["'self'"], fromEnv: [] },
    // Connect: self, API (http + ws for socket.io), and storage (for uploads)
    "connect-src": {
      base: ["'self'"],
      fromEnv: [
        apiUrl,
        // Add WebSocket URL for socket.io (convert http->ws, https->wss)
        apiUrl.replace(/^http/, "ws"),
        env.NEXT_PUBLIC_ADDRESS || "",
        ...imageSources,
      ],
    },
    // Frames: self, and the api/corpus origins (inline previews of stored objects)
    "frame-src": { base: ["'self'"], fromEnv: appOrigins },
    // Worker sources: self and blob (for Web Workers with dynamic imports)
    "worker-src": { base: ["'self'", "blob:"], fromEnv: [] },
  };

  const directive = (name: CspDirective): string => {
    const { base, fromEnv } = fetchDirectives[name];
    const fromServices = services.flatMap((service) => SERVICE_SOURCES[service][name] ?? []);
    const sources = [...base, ...fromServices, ...(options.csp?.[name] ?? []), ...fromEnv].filter(
      (source) => source !== "",
    );
    return [name, ...new Set(sources)].join(" ");
  };

  return [
    "default-src 'self'",
    directive("script-src"),
    directive("style-src"),
    directive("img-src"),
    directive("font-src"),
    directive("connect-src"),
    directive("frame-src"),
    // Frame ancestors: deny embedding (equivalent to X-Frame-Options: DENY)
    "frame-ancestors 'none'",
    // Form actions: only self
    "form-action 'self'",
    // Base URI: only self
    "base-uri 'self'",
    // Object sources: none (no plugins)
    "object-src 'none'",
    directive("worker-src"),
    // Upgrade insecure requests in production.
    //
    // NOT under E2E_BUILD: the e2e harness runs a PRODUCTION build (for speed)
    // and serves it over plain http on a custom hostname. With this directive
    // the browser rewrites every /_next/static asset to https, which nothing is
    // listening on — every chunk fails with ERR_SSL_PROTOCOL_ERROR, the page
    // never hydrates, and each spec sees only server-rendered markup.
    env.NODE_ENV === "production" && env.E2E_BUILD !== "true" ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");
}
