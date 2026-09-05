import { pageProfile } from "@/server/identity";
import { adminClient } from "@/server/supabase";
import { PracticeRepository } from "@/server/repositories/practice";
import { Account } from "@/components/account";
import { databaseError } from "@/server/repositories/mapping";
export default async function AccountPage() {
  const profile = await pageProfile();
  const [history, audio] = await Promise.all([
    new PracticeRepository().history(profile.id),
    adminClient()
      .from("audio_assets")
      .select("id,duration,expires_at")
      .eq("user_id", profile.id)
      .eq("state", "ready")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);
  databaseError(audio.error);
  return (
    <Account profile={profile} history={history} audio={audio.data ?? []} />
  );
}
