import js from "@eslint/js";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

/**
 * Flat ESLint config for Next.js 16.
 *
 * `next lint` was removed in Next 16, so linting runs through the ESLint CLI
 * directly (`npm run lint`). The previous config in this repository was a
 * leftover Vite/TanStack Start template that referenced plugins the project
 * does not install; it has been replaced with the official Next.js presets.
 */
export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "drizzle/**",
      "coverage/**",
      "next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    /**
     * `components/ui/**` is vendored shadcn/ui source, kept close to upstream so
     * it can be re-generated. Two upstream patterns (an embla effect in
     * `carousel`, a random skeleton width in `sidebar`) trip the React compiler
     * lint rules; they are downgraded here rather than diverging from upstream.
     */
    files: ["components/ui/**/*.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    },
  },
  {
    rules: {
      // Unused args prefixed with _ are an intentional signature marker.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
