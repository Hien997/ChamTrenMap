import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

// Next.js 16: `proxy.ts` (formerly `middleware.ts`).
// Negotiates the locale and redirects `/` → `/vi`.
export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for:
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
