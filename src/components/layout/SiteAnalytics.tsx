"use client";

import { Analytics } from "@vercel/analytics/react";

/**
 * Vercel Web Analytics — no cookie banner needed (cookieless, no PII stored),
 * which is why it is the default here rather than a tag manager. Renders
 * nothing and only ships in a production build.
 *
 * Public site only: the admin console is behind auth and its traffic is
 * already visible from the deployment logs.
 *
 * Rendered behind `process.env.VERCEL` in the layout: on any other host the
 * script route returns 404, and a broken `<script>` on every page is worse
 * than no analytics (it also pollutes local/CI console output, which
 * `e2e/smoke.spec.ts` asserts on).
 */
export const SiteAnalytics = () => {
  return <Analytics />;
};
