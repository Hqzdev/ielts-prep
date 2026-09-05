import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  resolve: { alias: { "@": path.resolve("apps/web/src") } },
  test: {
    include: ["apps/web/tests/**/*.test.ts", "packages/**/tests/**/*.test.ts"],
    exclude: [
      "**/node_modules/**",
      "**/.next/**",
      ...(process.env.TEST_INTEGRATION ? [] : ["**/*.integration.test.ts"]),
    ],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
