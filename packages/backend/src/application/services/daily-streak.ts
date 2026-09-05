import { DailyStreakCalculator } from "../../domain/daily-streak";
import type { LearningStore } from "../ports/learning";
import type { Clock } from "../ports/runtime";

export class DailyStreakService {
  constructor(
    private readonly store: Pick<LearningStore, "activityDates">,
    private readonly clock: Clock,
  ) {}

  async get(userId: string, timezone: string) {
    return new DailyStreakCalculator().calculate(
      await this.store.activityDates(userId),
      timezone,
      this.clock.now(),
    );
  }
}
