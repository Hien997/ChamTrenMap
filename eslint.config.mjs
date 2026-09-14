import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Local source-base guardrail: inline eslint directives are banned.
 * Fix the code or add a file-scoped override in this config instead.
 *
 * NOTE: this comment itself intentionally avoids the literal directive text so
 * the local rule does not flag its own documentation.
 */
const localPlugin = {
  rules: {
    "no-eslint-disable-comments": {
      meta: {
        type: "problem",
        docs: {
          description: "Disallow inline directives; use eslint.config.mjs.",
        },
      },
      create(context) {
        const sourceCode = context.sourceCode ?? context.getSourceCode?.();
        if (!sourceCode) return {};
        return {
          Program() {
            for (const comment of sourceCode.getAllComments()) {
              const text = comment.value.trim();
              if (/^eslint-(disable|enable)([\s,]|$)/.test(text)) {
                context.report({
                  loc: comment.loc ?? undefined,
                  message:
                    "Inline directives are not allowed. Fix the code or add a file-scoped override in eslint.config.mjs.",
                });
              }
            }
          },
        };
      },
    },
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Tooling & agent config — not project source:
    ".agents/**",
    "public/**",
  ]),
  // Source-base control: inline directives are banned everywhere.
  // noInlineConfig makes them inert; the local rule reports them as errors.
  {
    plugins: {
      local: localPlugin,
    },
    rules: {
      "local/no-eslint-disable-comments": "error",
    },
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: "error",
    },
  },
  {
    files: [
      "src/components/map/MapLibreMap.tsx",
      "src/components/map/MapMarker.tsx",
      "src/components/map/MapPopup.tsx",
    ],
    rules: {
      // MapLibre is imperative: markers/popups/controls are created from refs and
      // updated in place, so the default refs lint is relaxed
      // here via config (no inline disables allowed in source).
      // immutability is also relaxed: the marker sync reads locations through a
      // copied snapshot ref, but the rule's taint tracking still links the
      // snapshot back to the `locations` prop and reports a false positive.
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: [
      "src/components/tour/TourCard.tsx",
      "src/app/**/tours/**/page.tsx",
      "src/app/**/checkpoints/**/page.tsx",
      "src/app/**/share/**/page.tsx",
    ],
    rules: {
      // Admin-managed content images (CMS/photo URLs) have no fixed
      // remotePatterns, so plain <img> is intentional here for these
      // specific page/component sinks only. This is a file-scoped config
      // override, not an invitation to add inline eslint disables.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
