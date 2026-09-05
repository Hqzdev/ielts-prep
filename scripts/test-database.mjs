import fs from "node:fs";
import { spawnSync } from "node:child_process";

const configuration = fs.readFileSync("infra/supabase/config.toml", "utf8");
const project = /^project_id\s*=\s*"([a-zA-Z0-9_-]+)"/m.exec(
  configuration,
)?.[1];
if (!project) throw new Error("Missing local Supabase project ID");
for (const name of fs
  .readdirSync("infra/supabase/tests")
  .filter((file) => file.endsWith(".sql"))) {
  const result = spawnSync(
    "docker",
    [
      "exec",
      "-i",
      `supabase_db_${project}`,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    {
      input: fs.readFileSync(`infra/supabase/tests/${name}`),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  if (result.error || result.status !== 0)
    throw new Error(
      `Database contract failed: ${name}: ${result.error?.message ?? result.stderr}`,
    );
  console.log(`Database: ${name} passed; fixtures rolled back.`);
}
