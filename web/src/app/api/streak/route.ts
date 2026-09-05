import { handle } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { DailyStreakService } from "@/server/services/daily-streak";

export async function GET() {
  return handle(async () => {
    const profile = await requireProfile();
    return new DailyStreakService().get(profile.id, profile.timezone);
  });
}
