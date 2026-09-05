import { AuthShell } from "@/components/auth-shell";
import { redirect } from "next/navigation";
import { config } from "@/server/config";
import { AuthForm } from "@/components/auth-form";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  if (!config.databaseReady) redirect("/setup");
  const { invite } = await searchParams;
  return (
    <AuthShell>
      <AuthForm invite={invite} />
      {config.localDevelopment && (
        <form method="post" action="/auth/local" style={{ marginTop: 24 }}>
          <button className="button secondary" style={{ width: "100%" }}>
            Open local account
          </button>
        </form>
      )}
    </AuthShell>
  );
}
