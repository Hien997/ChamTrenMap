import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// S8: baseline security headers for every response. A Content-Security-Policy
// is intentionally not included yet — it needs nonce handling via middleware
// and a first pass over third-party origins (tile hosts, fonts); see
// docs/security-review.md for the follow-up.
const isDev = process.env.NODE_ENV === "development";

/**
 * The one configurable origin: an operator may point `NEXT_PUBLIC_MAP_STYLE_URL`
 * at their own tile provider, and a CSP that ignored it would blank the map.
 * Anything unparseable is skipped rather than injected into the header.
 */
const configuredStyleOrigin = (): string | null => {
  const raw = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  if (!raw) {
    return null;
  }
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
};

const unique = (values: (string | null)[]): string => {
  return [...new Set(values.filter((value): value is string => value !== null))]
    .join(" ")
    .trim();
};

/**
 * S8 follow-up: the Content-Security-Policy.
 *
 * Two deliberate deviations from the textbook setup, both documented in
 * `docs/security-review.md`:
 *
 * 1. **No nonce.** A per-request nonce has to be minted in the proxy and pushed
 *    into the render via `NextResponse.next({ request: { headers } })`, but this
 *    app's proxy is next-intl's middleware — wrapping it would mean
 *    re-issuing its rewrite/cookie response by hand, and a subtle break in
 *    locale routing is worse than the residual risk. `'unsafe-inline'` is kept
 *    for scripts; every *host* restriction below still holds, so a payload
 *    cannot pull a script from an attacker-controlled origin.
 * 2. **`upgrade-insecure-requests` only when the canonical origin is https** —
 *    otherwise it rewrites `http://localhost` asset URLs to https during
 *    local `next start`.
 *
 * `e2e/csp.spec.ts` loads the real pages in Chromium and fails on any
 * violation, so a policy that blocked Next's own bootstrap scripts could not
 * reach main.
 */
const contentSecurityPolicy = (): string => {
  const styleOrigin = configuredStyleOrigin();
  const tileHosts = [
    "https://tile.openstreetmap.org",
    "https://tiles.openfreemap.org",
    styleOrigin,
  ];

  const directives = [
    "default-src 'self'",
    // `unsafe-eval` is needed only by the dev server's HMR runtime.
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    // Inline `style` attributes are used for map markers and the lightbox.
    "style-src 'self' 'unsafe-inline'",
    `img-src ${unique(["'self'", "data:", "blob:", "https://picsum.photos", ...tileHosts])}`,
    "font-src 'self' data:",
    // Weather + OSRM routing + tile/style fetches (MapLibre uses fetch, not <img>).
    `connect-src ${unique(["'self'", "https://api.open-meteo.com", "https://router.project-osrm.de", ...tileHosts])}`,
    // MapLibre builds its worker from a blob URL.
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  if (process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")) {
    directives.push("upgrade-insecure-requests");
  }

  return `${directives.join("; ")};`;
};

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy(),
  },
  // HSTS only in production builds — never advertise it from `next dev`.
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // Admin-entered cover/gallery photos, served through the image optimizer so
  // the grid gets a responsive srcset + WebP instead of full-size downloads.
  // Deliberately a tight allowlist rather than `hostname: "**"`: the public
  // `/_next/image` route fetches its `url` parameter from the server, so an
  // open pattern would turn it into an SSRF proxy. Every image in the DB today
  // comes from picsum.photos — allowing one more host is a one-line change.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }],
  },
  headers: async () => {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
