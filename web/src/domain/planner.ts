import type { Profile } from "./profile";
import type { Task, Skill } from "./task";
import type { SkillStatistics } from "./statistics";

export interface PlannedSession {
  weekStart: string;
  scheduledDate: string;
  taskId: string;
  plannedMinutes: number;
  position: number;
}
export function localDate(timezone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((type) => parts.find((p) => p.type === type)!.value)
    .join("-");
}
export function addDays(date: string, amount: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}
export function weekStart(date: string): string {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return addDays(date, -((day + 6) % 7));
}

export class WeeklyPlanner {
  plan(
    profile: Profile,
    tasks: Task[],
    historyIds: string[],
    statistics: SkillStatistics[],
    today = localDate(profile.timezone),
  ): PlannedSession[] {
    const week = weekStart(today);
    const skills: Skill[] = ["writing", "reading", "speaking"];
    const weak = statistics
      .filter((s) => s.count >= 5)
      .sort((a, b) => (a.average ?? 0) - (b.average ?? 0))[0];
    if (weak) skills.unshift(weak.skill);
    const chosen = new Set<string>();
    const result: PlannedSession[] = [];
    let rotation = 0;
    const continuation: { current: { task: Task; minutes: number } | null } = {
      current: null,
    };
    for (let offset = 0; offset < 7; offset++) {
      const date = addDays(week, offset);
      const day = new Date(`${date}T12:00:00Z`).getUTCDay();
      if (date < today || !profile.studyDays.includes(day)) continue;
      let available = profile.dailyMinutes;
      while (available >= 3) {
        const skill = skills[rotation % skills.length];
        const weakFormat = statistics
          .find((s) => s.skill === skill && s.count >= 5)
          ?.formats.slice()
          .sort((a, b) => a.accuracy - b.accuracy)[0]?.format;
        const candidates = tasks
          .filter((t) => t.skill === skill && !chosen.has(t.id))
          .sort(
            (a, b) =>
              Number(historyIds.includes(a.id)) -
                Number(historyIds.includes(b.id)) +
                (weakFormat
                  ? (Number(b.format === weakFormat) -
                      Number(a.format === weakFormat)) *
                    0.5
                  : 0) || a.id.localeCompare(b.id),
          );
        const task: Task | undefined =
          continuation.current?.task ?? candidates[0];
        if (!task) break;
        const duration: number =
          continuation.current?.minutes ?? Math.ceil(task.durationSeconds / 60);
        if (duration > available && task.skill !== "writing") break;
        const minutes = Math.min(available, duration);
        result.push({
          weekStart: week,
          scheduledDate: date,
          taskId: task.id,
          plannedMinutes: minutes,
          position: result.length,
        });
        available -= minutes;
        if (minutes < duration) {
          continuation.current = { task, minutes: duration - minutes };
          break;
        }
        continuation.current = null;
        chosen.add(task.id);
        rotation++;
      }
    }
    return result;
  }
}
