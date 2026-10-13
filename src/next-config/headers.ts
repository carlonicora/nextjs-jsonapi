// Runtime imports: relative only. See csp.ts.
import { buildCsp, type CspOptions } from "./csp";

export interface SecurityHeaderOptions extends CspOptions {
  permissionsPolicy?: { camera?: "none" | "self" };
}

export interface HeaderRule {
  source: string;
  headers: { key: string; value: string }[];
}

export function buildSecurityHeaders(options: SecurityHeaderOptions, env: NodeJS.ProcessEnv): HeaderRule[] {
  const camera = options.permissionsPolicy?.camera === "none" ? "" : "self";

  return [
    {
      // Apply to all routes
      source: "/:path*",
      headers: [
        // Content Security Policy - prevents XSS attacks
        {
          key: "Content-Security-Policy",
          value: buildCsp(options, env),
        },
        // X-Frame-Options - prevents clickjacking (backup for older browsers)
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        // X-Content-Type-Options - prevents MIME sniffing
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        // Strict-Transport-Security - enforces HTTPS (1 year, include subdomains).
        // Omitted under E2E_BUILD for the same reason as upgrade-insecure-requests:
        // the suite speaks plain http, and an HSTS pin would force https on every
        // later request to this host from the same browser profile.
        ...(env.E2E_BUILD === "true"
          ? []
          : [
              {
                key: "Strict-Transport-Security",
                value: "max-age=31536000; includeSubDomains",
              },
            ]),
        // Referrer-Policy - controls referrer information
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        // Permissions-Policy - restricts browser features
        {
          key: "Permissions-Policy",
          value: `camera=(${camera}), microphone=(), geolocation=()`,
        },
      ],
    },
  ];
}
