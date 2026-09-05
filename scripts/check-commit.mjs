import fs from "node:fs";

const message = process.argv[2]
  ? fs.readFileSync(process.argv[2], "utf8").split("\n")[0]
  : (process.env.COMMIT_TITLE ?? "");
if (
  !/^(feat|fix|refactor|perf|test|docs|build|ci|chore|revert)(\([a-z0-9-]+\))?!?: .{1,100}$/.test(
    message,
  )
) {
  console.error(
    "Use a Conventional Commit title, for example: refactor(practice): separate persistence from the use case",
  );
  process.exitCode = 1;
}
