import { test as base, expect } from "@playwright/test";
import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local", quiet: true });
const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(dbUrl))
  throw new Error("Browser tests require local Supabase");
export const db = createClient(dbUrl, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});
export const test = base.extend<{ learner: string }>({
  learner: async ({ page }, run) => {
    const email = `browser-${randomUUID()}@ielts.local`;
    const password = randomUUID() + "Aa1!";
    const { data, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    const id = data.user.id;
    await db
      .from("profiles")
      .update({
        name: "Alex",
        beta_access: true,
        onboarded: true,
        timezone: "Asia/Yekaterinburg",
      })
      .eq("id", id);
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByRole("button", { name: "Use a password", exact: true }).click();
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await run(id);
    const { data: assets } = await db
      .from("audio_assets")
      .select("path")
      .eq("user_id", id);
    if (assets?.length)
      await db.storage.from("speaking").remove(assets.map((a) => a.path));
    await db.auth.admin.deleteUser(id);
  },
});
