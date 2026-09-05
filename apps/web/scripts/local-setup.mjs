import { spawnSync } from "node:child_process";
import { readFile, writeFile, chmod } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { parse } from "dotenv";

const appDirectory = new URL("../", import.meta.url);
const infrastructureDirectory = new URL("../../../infra/", import.meta.url);
const supabaseCli = new URL(
  "../../../node_modules/.bin/supabase",
  import.meta.url,
).pathname;

function run(command, args, capture = false, cwd = appDirectory) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
    env: {
      ...process.env,
      GOOGLE_CLIENT_ID:
        existing.GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID ?? "",
      GOOGLE_CLIENT_SECRET:
        existing.GOOGLE_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  });
  if (result.error || result.status !== 0)
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  return result.stdout;
}

const envPath = new URL("../.env.local", import.meta.url);
const existingText = await readFile(envPath, "utf8").catch(() => "");
const existing = parse(existingText);
if (
  existing.NEXT_PUBLIC_SUPABASE_URL &&
  !/^http:\/\/(127\.0\.0\.1|localhost):/.test(existing.NEXT_PUBLIC_SUPABASE_URL)
)
  throw new Error(
    "Local setup will not replace an external Supabase configuration",
  );
console.log("Starting local Supabase...");
run(supabaseCli, ["start"], true, infrastructureDirectory);
run(
  supabaseCli,
  ["migration", "up", "--local"],
  false,
  infrastructureDirectory,
);
const status = JSON.parse(
  run(supabaseCli, ["status", "-o", "json"], true, infrastructureDirectory),
);
const defaults = {
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.ANON_KEY,
  SUPABASE_SECRET_KEY: status.SERVICE_ROLE_KEY,
  APP_URL: "http://127.0.0.1:3000",
  GEMINI_API_KEY: "",
  ASSESSMENT_WRITING_ENABLED: "false",
  ASSESSMENT_SPEAKING_ENABLED: "false",
  CRON_SECRET: randomBytes(32).toString("hex"),
  LOCAL_BETA_EMAIL: "beta@ielts.local",
  LOCAL_BETA_PASSWORD: randomBytes(24).toString("base64url"),
};
const additions = Object.entries(defaults)
  .filter(([key, value]) => !existing[key] && value !== "")
  .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
  .join("\n");
await writeFile(
  envPath,
  existingText + (existingText.endsWith("\n") ? "" : "\n") + additions + "\n",
  { mode: 0o600 },
);
await chmod(envPath, 0o600);
run(process.execPath, ["--import", "tsx", "scripts/seed.ts"]);
console.log(
  "Local environment ready. Run pnpm dev, open http://127.0.0.1:3000/login and choose Open local account.",
);
