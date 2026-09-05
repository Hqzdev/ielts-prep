import "server-only";
import { cache } from "react";
import { adminClient } from "../supabase";
import { databaseError } from "../repositories/mapping";
import { DailyStreakCalculator } from "@/domain/daily-streak";

export class DailyStreakService {
  constructor(private readonly db = adminClient()) {}

  async get(userId: string, timezone: string) {
    const dates: string[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await this.db
        .from("learning_days")
        .select("activity_date")
        .eq("user_id", userId)
        .order("activity_date")
        .range(offset, offset + 999);
      databaseError(error);
      dates.push(...(data ?? []).map((day) => day.activity_date));
      if (!data || data.length < 1000) break;
    }
    return new DailyStreakCalculator().calculate(dates, timezone);
  }
}

export const currentDailyStreak = cache((userId: string, timezone: string) =>
  new DailyStreakService().get(userId, timezone),
);
