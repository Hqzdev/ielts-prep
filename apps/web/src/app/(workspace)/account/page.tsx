import { backend } from "@/server/backend";
import { pageProfile } from "@/server/identity";
import { Account } from "@/components/account";

export default async function AccountPage() {
  const profile = await pageProfile();
  const services = backend();
  const [history, audio] = await Promise.all([
    services.attempts.history(profile.id),
    services.audio.list(profile.id),
  ]);
  return <Account profile={profile} history={history} audio={audio} />;
}
