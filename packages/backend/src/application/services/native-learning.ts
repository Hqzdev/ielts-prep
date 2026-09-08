import { AppError } from "../../domain/errors";
import {
  NativeOnboardingRules,
  type NativeAnswers,
  type NativeSkill,
} from "../../domain/native-profile";
import { NativeForecast } from "../../domain/native-forecast";
import { localDate } from "../../domain/planner";
import type { Profile } from "../../domain/profile";
import type { NativeStore } from "../ports/native";
import type { Clock } from "../ports/runtime";
import type { CatalogStore, PracticeStore } from "../ports/practice";
import type { LearningService } from "./learning";
import type { DailyStreakService } from "./daily-streak";

export class NativeLearningService {
  constructor(
    private readonly store: NativeStore,
    private readonly catalog: CatalogStore,
    private readonly attempts: PracticeStore,
    private readonly learning: LearningService,
    private readonly streak: DailyStreakService,
    private readonly clock: Clock,
  ) {}
  async saveOnboarding(
    profile: Profile,
    input: {
      revision: number;
      step: number;
      answers: NativeAnswers;
      complete: boolean;
    },
  ) {
    const today = localDate(profile.timezone, this.clock.now());
    const rules = new NativeOnboardingRules();
    if (input.complete) rules.validateCompletion(input.answers, today);
    else if (input.step > rules.resumeStep(input.answers, today))
      throw new AppError(
        "ONBOARDING_INCOMPLETE",
        "Answer the previous question first",
      );
    return this.store.saveOnboarding(
      profile.id,
      input.revision,
      input.step,
      input.answers,
      input.complete,
    );
  }
  async dashboard(profile: Profile) {
    const today = localDate(profile.timezone, this.clock.now());
    const [catalog, onboarding, streak] = await Promise.all([
      this.catalog.catalog(profile.id),
      this.store.onboarding(profile.id),
      this.streak.get(profile.id, profile.timezone),
    ]);
    const focus = onboarding.answers.focus.length
      ? onboarding.answers.focus
      : ["reading", "writing"];
    const candidates = [...new Set([...focus, "reading", "writing"])].flatMap(
      (skill) => {
        const entries = catalog
          .filter((item) => item.task.skill === skill)
          .sort(
            (a, b) =>
              Number(a.status === "completed") -
                Number(b.status === "completed") ||
              a.task.id.localeCompare(b.task.id),
          );
        return entries[0] ? [entries[0].task.id] : [];
      },
    );
    const ids = await this.store.plan(profile.id, today, candidates);
    const tasks = ids.flatMap((id) =>
      catalog.filter((item) => item.task.id === id),
    );
    const completed = tasks.filter(
      (item) =>
        item.status === "completed" &&
        item.lastActivity &&
        localDate(profile.timezone, new Date(item.lastActivity)) === today,
    ).length;
    return { today, tasks, completed, total: tasks.length, streak };
  }
  async progress(profile: Profile, days?: number) {
    const [statistics, history, streak] = await Promise.all([
      this.learning.statistics(profile.id, days),
      this.attempts.history(profile.id),
      this.streak.get(profile.id, profile.timezone),
    ]);
    const visible = new Set(["reading", "writing"]);
    statistics.skills = statistics.skills.filter((item) =>
      visible.has(item.skill),
    );
    statistics.history = statistics.history.filter((item) =>
      visible.has(item.skill),
    );
    statistics.independentCount = statistics.history.length;
    const visibleAttempts = history.filter(
      (attempt) =>
        visible.has(attempt.taskSnapshot.skill) &&
        (!days ||
          Date.parse(attempt.submittedAt ?? attempt.createdAt) >=
            this.clock.now().getTime() - days * 86400000),
    );
    statistics.revisionCount = visibleAttempts.filter(
      (attempt) =>
        attempt.parentAttemptId &&
        ["submitted", "completed"].includes(attempt.status),
    ).length;
    const activity = new Map<string, number>();
    for (const item of statistics.history) {
      const date = localDate(profile.timezone, new Date(item.date));
      activity.set(date, (activity.get(date) ?? 0) + 1);
    }
    statistics.activity = [...activity].map(([date, count]) => ({
      date,
      count,
    }));
    statistics.totalMinutes = statistics.history.reduce(
      (sum, item) => sum + item.durationMinutes,
      0,
    );
    const full = await this.learning.statistics(profile.id, 90);
    const forecasts = (["reading", "writing"] as NativeSkill[]).map((skill) =>
      new NativeForecast().calculate(
        skill,
        profile.targetBand,
        full.history
          .filter((item) => item.skill === skill && item.band !== null)
          .flatMap((item) => {
            const attempt = history.find((attempt) => attempt.id === item.id);
            return attempt && !attempt.parentAttemptId
              ? [
                  {
                    date: item.date,
                    band: item.band!,
                    format:
                      String(attempt.taskSnapshot.part) +
                      ":" +
                      attempt.taskSnapshot.format,
                  },
                ]
              : [];
          }),
        this.clock.now(),
        profile.timezone,
      ),
    );
    return { statistics, forecasts, streak };
  }
}
