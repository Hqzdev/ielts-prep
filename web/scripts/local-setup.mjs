import { spawnSync } from "node:child_process";
import { readFile, writeFile, chmod } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { parse } from "dotenv";

function run(command, args, capture = false) {
  const result = spawnSync(command, args, {
    cwd: new URL("../", import.meta.url),
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
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
run("./node_modules/.bin/supabase", ["start"], true);
run("./node_modules/.bin/supabase", ["migration", "up", "--local"]);
const status = JSON.parse(
  run("./node_modules/.bin/supabase", ["status", "-o", "json"], true),
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
