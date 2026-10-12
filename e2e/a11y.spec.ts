import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Accessibility gate (WCAG 2.1 A/AA).
 *
 * Scoped to `serious` + `critical` so a cosmetic `minor` finding cannot block
 * a deploy, but anything that actually stops a screen-reader or keyboard user
 * does. Runs against the real rendered pages, which is the only place colour
 * contrast and heading order can honestly be measured.
 */

const routes = ["/vi", "/en", "/tours", "/admin/login"];

for (const route of routes) {
  test(`no serious or critical a11y violations on ${route}`, async ({
    page,
  }) => {
    await page.goto(route);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical",
    );

    expect(
      blocking.map(
        (violation) =>
          `${violation.id} (${violation.impact}): ${violation.help} — ${violation.nodes.length} node(s), first: ${violation.nodes[0]?.target.join(" ")}`,
      ),
    ).toEqual([]);
  });
}
