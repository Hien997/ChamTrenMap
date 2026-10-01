import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path: string): string =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const PAGES = [
  "../src/app/[locale]/private-tour/page.tsx",
  "../src/app/[locale]/private-tour/[code]/page.tsx",
] as const;

/** The one component that may decide what a private-tour URL shows. */
const GATE = "../src/components/tour/PrivateTourUnlockGate.tsx";

type Oklch = readonly [lightness: number, chroma: number, hue: number];
type Rgb = readonly [number, number, number];

/** Every `--name: oklch(L C H)` declaration inside one CSS block. */
const readOklchTokens = (block: string): Record<string, Oklch> => {
  const tokens: Record<string, Oklch> = {};
  const declarations = /--([\w-]+):\s*oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/g;

  for (const [, name, l, c, h] of block.matchAll(declarations)) {
    tokens[name] = [+l, +c, +h] as Oklch;
  }

  return tokens;
};

/** oklab → linear-light sRGB, clipped to the gamut (WCAG uses linear values). */
const linearRgb = ([L, C, H]: Oklch): Rgb => {
  const radians = (H * Math.PI) / 180;
  const a = C * Math.cos(radians);
  const b = C * Math.sin(radians);

  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const clip = (value: number) => Math.min(1, Math.max(0, value));
  return [
    clip(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clip(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clip(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
};

const contrastRatio = (foreground: Oklch, background: Oklch): number => {
  const luminance = (rgb: Rgb) =>
    0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];

  const [lighter, darker] = [
    luminance(linearRgb(foreground)),
    luminance(linearRgb(background)),
  ].sort((x, y) => y - x);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * The customer-facing half of ADR-0006: what a private-tour page is allowed to
 * show, and the two things it must never lose (a way to switch language, and
 * the server's check-in gate). These read the sources rather than rendering
 * them because the guarantees are about which components are mounted — a
 * rendered test would still pass if the mount moved behind a conditional.
 */
describe("private-tour routes", () => {
  it("mount the shared shell, so the language switcher is always reachable", () => {
    for (const page of PAGES) {
      expect(read(page)).toContain("<PrivateTourShell>");
    }
    // The public pages get their switcher from `SiteHeader`; these two
    // deliberately do not render that, so the shell is the only place left.
    expect(read("../src/components/tour/PrivateTourShell.tsx")).toContain(
      "<LocaleSwitcher />",
    );
  });

  it("never render SiteHeader, which links to the public catalogue", () => {
    for (const page of PAGES) {
      expect(read(page)).not.toContain("SiteHeader");
    }
  });

  it("show the stops on a map as well as in the itinerary", () => {
    expect(read(GATE)).toContain("<PrivateTourExperience");
    expect(read("../src/components/tour/PrivateTourExperience.tsx")).toContain(
      "<PrivateTourMap",
    );
    expect(read("../src/components/tour/PrivateTourMap.tsx")).toContain(
      "privateStopsToPath",
    );
  });

  it("give the map no way to claim a stop on its own", () => {
    // Read-only by construction: the map never talks to the network, so
    // arriving still goes through the itinerary's GPS post and widening what
    // the map renders widens nothing private.
    const map = read("../src/components/tour/PrivateTourMap.tsx");
    expect(map).not.toContain("fetch(");
    expect(map).not.toContain("getCurrentPositionOnce");

    expect(read("../src/components/tour/PrivateTourItinerary.tsx")).toContain(
      "/api/private-tours/visit",
    );
  });

  it("let one check-in update the map and the itinerary together", () => {
    expect(read("../src/components/tour/PrivateTourItinerary.tsx")).toContain(
      "onVisitedChange(",
    );
    expect(read("../src/components/tour/PrivateTourMap.tsx")).toContain(
      "visited.has(",
    );
  });
});

/**
 * A private-tour URL must never be enough on its own: the itinerary is handed
 * over by `POST /api/private-tours/access`, which demands the code *and* the
 * phone number, and no route may render tour data from anything else — least of
 * all the `ctm_private` holder cookie, which survives a refresh and would turn
 * "already unlocked once" into permanent access to the link.
 *
 * These read the sources rather than rendering them because the guarantee is
 * about *which* code a route may run: a rendered test would still pass if the
 * cookie read moved behind a conditional, and the cookie read is exactly the
 * thing being removed.
 */
describe("private-tour unlock gate", () => {
  it("leaves neither route any way to render tour data on its own", () => {
    for (const page of PAGES) {
      const src = read(page);
      expect(src).toContain("<PrivateTourUnlockGate");
      expect(src).not.toContain("readPrivateTourKey");
      expect(src).not.toContain("readUnlockedPrivateTour");
      expect(src).not.toContain("<PrivateTourExperience");
      expect(src).not.toContain("PanoramaViewer");
    }
  });

  it("reaches the itinerary only from inside the unlocked branch", () => {
    const gate = read(GATE);
    const branch = gate.slice(
      gate.indexOf("if (tour)"),
      gate.indexOf("export default"),
    );

    // The itinerary exists in one place, and that place is guarded by the tour
    // the POST returned — never by a cookie the browser hands over for free.
    expect(gate.indexOf("if (tour)")).toBeGreaterThan(-1);
    expect(branch).toContain("<PrivateTourExperience");
    expect(gate.indexOf("/api/private-tours/access")).toBeLessThan(
      gate.indexOf("if (tour)"),
    );
    expect(gate).not.toContain("readPrivateTourKey");
    expect(gate).not.toContain("ctm_private");
  });

  it("keeps no service-side read a holder cookie could satisfy", () => {
    // The read path is deleted rather than left unused: dead security code
    // still reads as a guarantee, and this one skipped the ACTIVE/expiry gates
    // its siblings enforce.
    expect(read("../src/services/private-tours.service.ts")).not.toContain(
      "readUnlockedPrivateTour",
    );
  });
});

describe("the private backdrop", () => {
  it("re-inks its own subtree, so text does not inherit body's light-theme colour", () => {
    // `body` sets `color: var(--foreground)` and body sits *outside* the skin,
    // so the value it computes is `:root`'s dark navy. That colour is what
    // every unclassed <h1>/<h2>/<p> inherits — dark ink on a near-black
    // ground, i.e. invisible headings and stop names. Shadcn tokens on their
    // own do not fix it: they only re-resolve for elements carrying a
    // `text-*` utility.
    const css = read("../src/app/globals.css");
    const start = css.indexOf(".private-tour-skin {");
    const block = css.slice(start, css.indexOf("}", start));

    expect(start).toBeGreaterThan(-1);
    expect(block).toContain("color: var(--foreground)");
  });

  it("keeps every text pair it defines above the WCAG AA floor", () => {
    const css = read("../src/app/globals.css");
    const start = css.indexOf(".private-tour-skin {");
    const tokens = readOklchTokens(css.slice(start, css.indexOf("}", start)));

    const pairs: ReadonlyArray<[string, string, string]> = [
      ["foreground", "background", "body copy"],
      ["card-foreground", "card", "stop names"],
      ["muted-foreground", "background", "subtitles"],
      ["muted-foreground", "card", "addresses"],
      ["muted-foreground", "muted", "check-in feedback"],
      ["secondary-foreground", "secondary", "locale switcher idle"],
      ["accent-foreground", "accent", "locale switcher active"],
      ["primary-foreground", "primary", "arrived button"],
      ["primary", "background", "badge"],
      ["destructive", "background", "error text"],
    ];

    for (const [fg, bg, usage] of pairs) {
      const ratio = contrastRatio(tokens[fg], tokens[bg]);
      expect(ratio, `${usage} (${fg} on ${bg})`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("is scoped to its own wrapper rather than re-theming the document", () => {
    const css = read("../src/app/globals.css");
    const skinStart = css.indexOf(".private-tour-skin {");

    expect(skinStart).toBeGreaterThan(-1);
    // Tokens are shadowed on the wrapper, so the `:root` palette the rest of
    // the app reads is untouched.
    expect(css.indexOf(":root")).toBeLessThan(skinStart);
    expect(
      css.slice(skinStart, css.indexOf("@keyframes private-tour-glow")),
    ).toContain("--background:");
  });

  it("only drifts when the visitor has not asked for less motion", () => {
    const css = read("../src/app/globals.css");

    expect(css).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(css).toContain("animation: private-tour-glow");
  });
});
