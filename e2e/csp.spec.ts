import { expect, test } from "@playwright/test";

/**
 * Content-Security-Policy gate (security-review S8).
 *
 * The header alone proves nothing — a policy that blocks Next.js's own
 * bootstrap scripts is worse than no policy at all, and that failure is
 * invisible to `npm run check`. So this asserts both halves: the header is
 * sent, and a real browser reports zero violations while the page runs.
 */

test("public pages send a Content-Security-Policy", async ({ request }) => {
  const response = await request.get("/vi");
  const csp = response.headers()["content-security-policy"];

  expect(csp, "CSP header missing").toBeTruthy();
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("base-uri 'self'");
});

test("home page runs without a single CSP violation", async ({ page }) => {
  const violations: string[] = [];
  // Match only CSP's own wording — a MIME-type or 404 message can also start
  // with "Refused to" and is a different problem entirely.
  const isCspViolation = (text: string) => /Content Security Policy/i.test(text);

  page.on("console", (message) => {
    if (isCspViolation(message.text())) {
      violations.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    if (isCspViolation(error.message)) {
      violations.push(error.message);
    }
  });

  await page.goto("/vi");
  await page.waitForLoadState("networkidle");

  expect(violations, violations.join("\n")).toEqual([]);
});

test("the admin console is covered too", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (message) => {
    if (/Content Security Policy/i.test(message.text())) {
      violations.push(message.text());
    }
  });

  await page.goto("/admin/login");
  await page.waitForLoadState("networkidle");

  expect(violations, violations.join("\n")).toEqual([]);
});
