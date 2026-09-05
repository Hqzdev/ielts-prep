import { backend } from "@/server/backend";
import { currentProfile, pageProfile } from "@/server/identity";

import { Dashboard } from "@/components/dashboard";
import { WorkspaceShell } from "@/components/workspace-shell";
import { Landing } from "@/components/landing";

export const dynamic = "force-dynamic";
export default async function HomePage() {
  if (!(await currentProfile())) return <Landing />;
  const profile = await pageProfile();
  const data = await backend().learning.dashboard(profile);
  return (
    <WorkspaceShell profile={profile}>
      <Dashboard data={data} profile={profile} />
    </WorkspaceShell>
  );
}
