import { redirect } from "next/navigation";
import { currentProfile } from "@/server/identity";
import { ProfileForm } from "@/components/profile-form";
export default async function OnboardingPage() {
  const profile = await currentProfile();
  if (!profile) redirect("/login");
  if (!profile.betaAccess) redirect("/access");
  return (
    <main className="page" style={{ maxWidth: 820, paddingTop: 55 }}>
      <p className="eyebrow">Veylo · first step</p>
      <h1>Let&apos;s build your study plan</h1>
      <p className="muted" style={{ marginTop: 16, marginBottom: 35 }}>
        Tell us your goal and when you prefer to study. You can change these
        later.
      </p>
      <ProfileForm profile={profile} onboarding />
    </main>
  );
}
