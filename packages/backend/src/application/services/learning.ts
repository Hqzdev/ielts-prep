import { StatisticsCalculator } from "../../domain/statistics";
import { WeeklyPlanner, localDate, weekStart } from "../../domain/planner";
import type { Profile } from "../../domain/profile";
import type { StudySession, LearningStore } from "../ports/learning";
import type { PracticeStore, CatalogStore } from "../ports/practice";
import type { Clock } from "../ports/runtime";

export type { StudySession } from "../ports/learning";

export class LearningService {
  constructor(
    private readonly store: LearningStore,
    private readonly attempts: PracticeStore,
    private readonly catalog: CatalogStore,
    private readonly clock: Clock,
  ) {}

  async statistics(userId: string, days?: number) {
    const since = days
      ? new Date(this.clock.now().getTime() - days * 86400000)
      : undefined;
    const [attempts, assessments] = await Promise.all([
      this.attempts.history(userId),
      this.store.assessments(userId),
    ]);
    return new StatisticsCalculator().calculate(
      since
        ? attempts.filter(
            (attempt) =>
              new Date(attempt.submittedAt ?? attempt.createdAt) >= since,
          )
        : attempts,
      assessments,
    );
  }

  async dashboard(profile: Profile) {
    const today = localDate(profile.timezone, this.clock.now());
    const week = weekStart(today);
    const [statistics, history, tasks] = await Promise.all([
      this.statistics(profile.id),
      this.attempts.history(profile.id),
      this.catalog.tasks(),
    ]);
    let sessions = await this.store.sessions(profile.id, week);
    if (!sessions.length) {
      const plan = new WeeklyPlanner().plan(
        profile,
        tasks,
        history.map((attempt) => attempt.taskId),
        statistics.skills,
        today,
      );
      if (plan.length) await this.store.createPlan(profile.id, plan);
      sessions = await this.store.sessions(profile.id, week);
    }
    const finishedIds = new Set(
      history
        .filter((attempt) =>
          ["submitted", "completed"].includes(attempt.status),
        )
        .map((attempt) => attempt.id),
    );
    const completed = sessions.filter(
      (session) =>
        session.attemptId &&
        finishedIds.has(session.attemptId) &&
        session.status !== "completed",
    );
    if (completed.length) {
      await this.store.completeSessions(
        profile.id,
        completed.map((session) => session.id),
      );
      for (const session of completed) session.status = "completed";
    }
    const mapped = sessions.flatMap((session): StudySession[] => {
      const task = tasks.find((task) => task.id === session.taskId);
      return task ? [{ ...session, task }] : [];
    });
    const focus =
      statistics.skills
        .flatMap((skill) => skill.errors)
        .sort((a, b) => b.count - a.count)[0] ?? null;
    return {
      today,
      week,
      sessions: mapped,
      statistics,
      resume:
        history.find((attempt) =>
          ["in_progress", "paused"].includes(attempt.status),
        ) ?? null,
      focus,
    };
  }

  async start(userId: string, id: string) {
    const session = await this.store.session(userId, id);
    const attempt = session.attemptId
      ? await this.attempts.get(userId, session.attemptId)
      : await this.attempts.create(userId, session.taskId, "practice");
    await this.store.attachAttempt(
      userId,
      session,
      attempt.id,
      ["submitted", "completed"].includes(attempt.status),
    );
    return attempt;
  }

  async move(userId: string, id: string, date: string) {
    await this.store.session(userId, id);
    await this.store.move(userId, id, date);
    return { saved: true };
  }
}
