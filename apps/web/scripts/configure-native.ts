import { config } from "dotenv";
import { parseArgs } from "node:util";
import { mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";

config({ path: "apps/web/.env.local", quiet: true });
const { values } = parseArgs({ options: { api: { type: "string" } } });
const apiURL = new URL(
  values.api ?? "/api/v1",
  process.env.APP_URL ?? "http://127.0.0.1:3000",
).href;
const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
for (const value of [apiURL, supabaseURL]) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new Error(
      "Native configuration requires HTTPS or a local simulator server",
    );
}
if (!publishableKey) throw new Error("Set the Supabase publishable key first");
if (!publishableKey.startsWith("sb_publishable_")) {
  const payload = JSON.parse(
    Buffer.from(publishableKey.split(".")[1] ?? "", "base64url").toString(
      "utf8",
    ),
  );
  if (payload.role !== "anon")
    throw new Error(
      "Only the public Supabase anon or publishable key belongs in the app",
    );
}
await mkdir("apps/ios/Veylo/Resources", { recursive: true });
const result = spawnSync(
  "/usr/bin/plutil",
  [
    "-convert",
    "xml1",
    "-o",
    "apps/ios/Veylo/Resources/BackendConfiguration.plist",
    "-",
  ],
  {
    input: JSON.stringify({ apiURL, supabaseURL, publishableKey }),
    encoding: "utf8",
  },
);
if (result.status !== 0) throw new Error(result.stderr);
console.log("Native public configuration saved. Rebuild Veylo iOS.");
