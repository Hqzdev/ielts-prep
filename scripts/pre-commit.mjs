import { spawnSync } from "node:child_process";

const paths = spawnSync(
  "git",
  ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
  { encoding: "utf8" },
).stdout;
const checks = [
  "format:check",
  "architecture:check",
  "api:check",
  "design:check",
  "lint",
  "typecheck",
];
if (/\.py$|pyproject\.toml$|uv\.lock$/m.test(paths))
  checks.push("python:check");
for (const command of checks) {
  const result = spawnSync("pnpm", [command], { stdio: "inherit" });
  if (result.error || result.status !== 0) process.exit(result.status ?? 1);
}
