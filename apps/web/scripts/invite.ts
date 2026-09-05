import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "node:util";
import { z } from "zod";
import { createTooling } from "@veylo/backend/composition/tooling";

config({ path: ".env.local", quiet: true });
const { values } = parseArgs({
  options: {
    email: { type: "string" },
    promote: { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
});
if (values.help || !values.email) {
  console.log(
    "pnpm admin:invite --email learner@example.com\npnpm admin:invite --email owner@example.com --promote\nCreates an invitation link without sending email. Promotion requires an existing verified account.",
  );
} else {
  const email = z.email().parse(values.email.trim().toLowerCase());
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  const appUrl = process.env.APP_URL;
  if (!url || !key || !appUrl)
    throw new Error("Configure Supabase and APP_URL first");
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  if (values.promote) {
    const { data: profile, error } = await db
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();
    if (error || !profile)
      throw new Error("Register and confirm this email first");
    const user = await db.auth.admin.getUserById(profile.id);
    if (!user.data.user?.email_confirmed_at)
      throw new Error("Email must be confirmed");
    const updated = await db
      .from("profiles")
      .update({ role: "admin", beta_access: true })
      .eq("id", profile.id);
    if (updated.error) throw new Error("ADMIN_UPDATE_FAILED");
    console.log("Administrator access granted");
  } else
    console.log(
      JSON.stringify(
        await createTooling(db, appUrl).invitations.issue(email),
        null,
        2,
      ),
    );
}
