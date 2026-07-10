import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
    // Auto-generated Claude Code helper files (CJS, not part of app build)
    ".claude/**",
    // Test coverage output
    "coverage/**",
    // Built package output (e.g. engine-sdk dist)
    "packages/*/dist/**",
  ]),
]);

export default eslintConfig;
