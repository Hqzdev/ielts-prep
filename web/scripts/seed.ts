import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { authoredBank } from "../src/content/bank";
import { ContentImporter } from "../src/server/services/content-import";
import { vocabularyBank } from "../src/content/vocabulary";

config({ path: ".env.local", quiet: true });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key)
  throw new Error(
    "Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY first",
  );
const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
console.log(await new ContentImporter(db).import(authoredBank()));
const vocabulary = await db.from("vocabulary_words").upsert(vocabularyBank());
if (vocabulary.error) throw vocabulary.error;
console.log(`Vocabulary: ${vocabularyBank().length} entries`);
if (
  /^http:\/\/(localhost|127\.0\.0\.1):/.test(url) &&
  process.env.LOCAL_BETA_EMAIL &&
  process.env.LOCAL_BETA_PASSWORD
) {
  const { data, error } = await db.auth.admin.listUsers();
  if (error) throw error;
  let user = data.users.find(
    (user) => user.email === process.env.LOCAL_BETA_EMAIL,
  );
  const isNew = !user;
  if (!user) {
    const created = await db.auth.admin.createUser({
      email: process.env.LOCAL_BETA_EMAIL,
      password: process.env.LOCAL_BETA_PASSWORD,
      email_confirm: true,
      user_metadata: { name: "Yaroslav" },
    });
    if (created.error) throw created.error;
    user = created.data.user;
  }
  const result = await db
    .from("profiles")
    .update({
      role: "admin",
      beta_access: true,
      ...(isNew
        ? {
            onboarded: true,
            name: "Yaroslav",
            timezone: "Asia/Yekaterinburg",
            study_days: [0, 1, 2, 3, 4, 5, 6],
          }
        : {}),
    })
    .eq("id", user.id);
  if (result.error) throw result.error;
  console.log("Local beta account ready");
}
