import { pageProfile } from "@/server/identity";
import { WorkspaceShell } from "@/components/workspace-shell";

export const dynamic = "force-dynamic";
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const profile = await pageProfile();
  return <WorkspaceShell profile={profile}>{children}</WorkspaceShell>;
}
