import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// S8: baseline security headers for every response. A Content-Security-Policy
// is intentionally not included yet — it needs nonce handling via middleware
// and a first pass over third-party origins (tile hosts, fonts); see
// docs/security-review.md for the follow-up.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
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
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
