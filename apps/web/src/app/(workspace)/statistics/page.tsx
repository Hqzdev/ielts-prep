import { backend } from "@/server/backend";
import { pageProfile } from "@/server/identity";

import { Statistics } from "@/components/statistics";
export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; period?: string }>;
}) {
  const profile = await pageProfile();
  const params = await searchParams;
  const days = (
    { week: 7, month: 30, "3mo": 90, "6mo": 180 } as Record<string, number>
  )[params.period ?? "month"];
  return (
    <Statistics
      data={await backend().learning.statistics(
        profile.id,
        params.tab !== "history" ? days : undefined,
      )}
      profile={profile}
    />
  );
}
