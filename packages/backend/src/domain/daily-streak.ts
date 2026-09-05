import { addDays, localDate, weekStart } from "./planner";

export interface DailyStreak {
  today: string;
  timezone: string;
  current: number;
  best: number;
  todayComplete: boolean;
  week: {
    date: string;
    label: string;
    state: "earned" | "today" | "missed" | "upcoming";
  }[];
}

export class DailyStreakCalculator {
  calculate(dates: string[], timezone: string, now = new Date()): DailyStreak {
    const today = localDate(timezone, now);
    const days = [...new Set(dates.filter((date) => date <= today))].sort();
    const earned = new Set(days);
    let best = 0;
    let run = 0;
    let previous: string | undefined;
    for (const day of days) {
      run = previous && addDays(previous, 1) === day ? run + 1 : 1;
      best = Math.max(best, run);
      previous = day;
    }
    const todayComplete = earned.has(today);
    let cursor = todayComplete ? today : addDays(today, -1);
    let current = 0;
    while (earned.has(cursor)) {
      current++;
      cursor = addDays(cursor, -1);
    }
    const monday = weekStart(today);
    return {
      today,
      timezone,
      current,
      best,
      todayComplete,
      week: Array.from({ length: 7 }, (_, index) => {
        const date = addDays(monday, index);
        return {
          date,
          label: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index],
          state: earned.has(date)
            ? "earned"
            : date === today
              ? "today"
              : date < today
                ? "missed"
                : "upcoming",
        };
      }),
    };
  }
}
