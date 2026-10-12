import { expect, test } from "@playwright/test";

/**
 * Smoke: the paths every visitor takes, asserted against the built app rather
 * than a component. The console is watched because a runtime error here (a
 * blocked script, a hydration mismatch) is invisible to `npm run check`.
 */

test("home renders header, hero and footer in Vietnamese", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("/vi");

  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  await expect(page.locator("header")).toBeVisible();
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();

  expect(consoleErrors, `console errors: ${consoleErrors.join(" | ")}`).toEqual(
    [],
  );
});

test("the secondary hero CTA scrolls to the featured section", async ({
  page,
}) => {
  await page.goto("/vi");

  // The CTA only exists when there are featured tours, so an empty database
  // has nothing to assert here — the unit-level `check` already runs against a
  // seeded DB, CI does not.
  const cta = page.locator('a[href="#explore"]');
  if ((await cta.count()) === 0) {
    test.skip();
  }
  await expect(cta.first()).toBeVisible();

  await cta.first().click();
  await expect(page).toHaveURL(/#explore$/);
  await expect(page.locator("#explore")).toBeInViewport();
});

test("/en is genuinely English — the footer no longer leaks Vietnamese", async ({
  page,
}) => {
  await page.goto("/en");

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("footer")).toContainText("Local check-in map");
});

test("tour listing links through to a detail page", async ({ page }) => {
  await page.goto("/tours");

  const firstTour = page.locator('main a[href^="/en/tours/"]').first();
  if ((await firstTour.count()) === 0) {
    test.skip();
  }
  await firstTour.click();
  await expect(page.locator("h1")).toBeVisible();
});
