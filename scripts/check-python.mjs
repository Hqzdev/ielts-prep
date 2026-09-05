import { spawnSync } from "node:child_process";

const checks = [
  ["ruff", "check", "tools/content-generator", "--config", "pyproject.toml"],
  ["black", "--check", "--config", "pyproject.toml", "tools/content-generator"],
  [
    "python",
    "-m",
    "unittest",
    "discover",
    "-s",
    "tools/content-generator",
    "-p",
    "test_*.py",
  ],
  ["python", "tools/content-generator/generate_tasks.py", "--help"],
];
for (const command of checks) {
  const result = spawnSync(
    "uv",
    ["run", "--project", "tools/content-generator", "--frozen", ...command],
    { stdio: "inherit" },
  );
  if (result.error || result.status !== 0) process.exit(result.status ?? 1);
}
