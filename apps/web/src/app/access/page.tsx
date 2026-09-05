import Link from "next/link";
import { redirect } from "next/navigation";
import { currentProfile } from "@/server/identity";
import { AcceptInvitation } from "@/components/accept-invitation";
export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;
  const profile = await currentProfile();
  if (profile?.betaAccess) redirect("/");
  return (
    <main className="auth-page">
      <p className="eyebrow">Veylo · closed beta</p>
      <h1>{invite ? "You're invited" : "Invitation required"}</h1>
      <p className="muted">
        {profile
          ? `You're signed in as ${profile.email}.`
          : "Sign in with the email address this invitation was sent to."}
      </p>
      {profile && invite ? (
        <AcceptInvitation token={invite} />
      ) : (
        <Link
          className="button"
          href={
            invite ? `/login?invite=${encodeURIComponent(invite)}` : "/login"
          }
        >
          Sign in to your account
        </Link>
      )}
      {!invite && (
        <p className="small muted" style={{ marginTop: 24 }}>
          Open your personal invitation link from the administrator to start
          learning.
        </p>
      )}
    </main>
  );
}
