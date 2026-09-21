import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".agents/**",
    "public/**",
  ]),
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
      "src/components/checkpoint/CheckpointGallery.tsx",
      "src/app/**/tours/**/page.tsx",
      "src/app/**/checkpoints/**/page.tsx",
      "src/app/**/share/**/page.tsx",
    ],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  {
    files: [
      "src/components/three/PanoramaViewer.tsx",
      "src/lib/reduced-motion.ts",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: [
      "src/components/three/PanoramaViewer.tsx",
    ],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "padding-line-between-statements": [
        "error",
        { blankLine: "any", prev: ["return"], next: ["return"] },
      ],
      "eqeqeq": ["error", "always", { "null": "ignore" }],
      "no-console": "warn",
      "react/self-closing-comp": "error",
      "react/no-array-index-key": "warn",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    files: ["src/lib/api.ts"],
    rules: {
      "no-console": "off",
    },
  },
]);

export default eslintConfig;

