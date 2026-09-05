import type { Profile } from "@veylo/backend/domain/profile";
import { SiteNavigation, PreppyAssistantButton } from "./site-navigation";
import { currentDailyStreak } from "@/server/services/daily-streak";
import { DailyStreakProvider } from "./daily-streak-provider";

export async function WorkspaceShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const streak = await currentDailyStreak(profile.id, profile.timezone);
  return (
    <DailyStreakProvider initial={streak}>
      <div className="app-shell">
        <SiteNavigation profile={profile} />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <PreppyAssistantButton />
      </div>
    </DailyStreakProvider>
  );
}
