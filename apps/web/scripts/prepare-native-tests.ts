import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile, rm, chmod } from "node:fs/promises";
import { spawnSync } from "node:child_process";

config({ path: "apps/web/.env.local", quiet: true });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url))
  throw new Error("Native fixtures require local Supabase");
const db = createClient(url, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});
const fixture = ".local/native-test-account.json";
async function recordingTester(id: string, add: boolean) {
  const file = "apps/web/.env.local";
  const source = await readFile(file, "utf8");
  const match = source.match(/^IOS_RECORDING_TESTER_IDS=(.*)$/m);
  const ids = new Set(
    (match?.[1] ?? "")
      .replace(/^["']|["']$/g, "")
      .split(",")
      .filter(Boolean),
  );
  if (add) ids.add(id);
  else ids.delete(id);
  const line = "IOS_RECORDING_TESTER_IDS=" + [...ids].join(",");
  await writeFile(
    file,
    match ? source.replace(match[0], line) : source + "\n" + line + "\n",
    { mode: 0o600 },
  );
}
const output = "apps/ios/VeyloUITests/NativeTestAccount.plist";
const existing = await readFile(fixture, "utf8").catch(
  (error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  },
);
if (existing) {
  const account = JSON.parse(existing);
  await recordingTester(account.id, false);
  const assets = await db
    .from("audio_assets")
    .select("path")
    .eq("user_id", account.id);
  if (assets.error) throw assets.error;
  if (assets.data.length) {
    const deleted = await db.storage
      .from("speaking")
      .remove(assets.data.map((asset) => asset.path));
    if (deleted.error) throw deleted.error;
  }
  const deleted = await db.auth.admin.deleteUser(account.id);
  if (deleted.error && deleted.error.status !== 404) throw deleted.error;
  await rm(fixture, { force: true });
  await rm(output, { force: true });
}
if (process.argv.includes("--cleanup")) {
  console.log("Isolated native test fixture cleaned");
} else {
  const email = "ios-test-" + randomUUID() + "@ielts.local";
  const password = randomUUID() + "Aa1!";
  const created = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: "iOS Learner" },
  });
  if (created.error) throw created.error;
  const recording = process.argv.includes("--recording");
  if (recording) await recordingTester(created.data.user.id, true);
  await mkdir(".local", { recursive: true });
  await writeFile(
    fixture,
    JSON.stringify({ id: created.data.user.id, email, password }),
    { mode: 0o600 },
  );
  const input = JSON.stringify({
    email,
    password,
    recording: String(recording),
  });
  const result = spawnSync(
    "/usr/bin/plutil",
    ["-convert", "xml1", "-o", output, "-"],
    { input, encoding: "utf8" },
  );
  if (result.status !== 0) throw new Error(result.stderr);
  await chmod(output, 0o600);
  console.log("Isolated native test fixture prepared; no credentials printed");
}
