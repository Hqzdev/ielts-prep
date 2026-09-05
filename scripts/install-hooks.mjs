import { spawnSync } from "node:child_process";

if (!process.env.CI) {
  const repository = spawnSync("git", ["rev-parse", "--git-dir"], {
    encoding: "utf8",
  });
  if (repository.status === 0) {
    const current = spawnSync("git", ["config", "--get", "core.hooksPath"], {
      encoding: "utf8",
    }).stdout.trim();
    if (current && current !== ".githooks")
      throw new Error(
        "Existing Git hooks must be integrated before enabling Veylo hooks",
      );
    const result = spawnSync("git", ["config", "core.hooksPath", ".githooks"], {
      stdio: "inherit",
    });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}
