import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    ".local/**",
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
    "supabase/.temp/**",
    "public/vad/**",
    "next-env.d.ts",
    "src/app/.well-known/**",
  ]),
]);
