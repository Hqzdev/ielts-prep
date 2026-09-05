import "server-only";
import { adminClient } from "../supabase";
import { PracticeRepository } from "../repositories/practice";
import { CatalogRepository } from "../repositories/catalog";
import {
  databaseError,
  mapAssessment,
  camelRow,
} from "../repositories/mapping";
import { StatisticsCalculator } from "@/domain/statistics";
import { WeeklyPlanner, localDate, weekStart } from "@/domain/planner";
import type { Profile } from "@/domain/profile";
import type { Task } from "@/domain/task";
import { AppError } from "@/domain/errors";

export interface StudySession {
  id: string;
  scheduledDate: string;
  weekStart: string;
  taskId: string;
  plannedMinutes: number;
  status: "planned" | "started" | "completed" | "skipped";
  attemptId: string | null;
  position: number;
  task: Task;
}
export class LearningService {
  constructor(
    private readonly db = adminClient(),
    private readonly attempts = new PracticeRepository(),
    private readonly catalog = new CatalogRepository(),
  ) {}
  async statistics(userId: string, days?: number) {
    const since = days ? new Date(Date.now() - days * 86400000) : undefined;
    const [attempts, result] = await Promise.all([
      this.attempts.history(userId),
      this.db.from("assessments").select("*").eq("user_id", userId).limit(5000),
    ]);
    databaseError(result.error);
    return new StatisticsCalculator().calculate(
      since
        ? attempts.filter(
            (attempt) =>
              new Date(attempt.submittedAt ?? attempt.createdAt) >= since,
          )
        : attempts,
      (result.data ?? []).map(mapAssessment),
    );
  }
  async dashboard(profile: Profile) {
    const today = localDate(profile.timezone);
    const week = weekStart(today);
    const [statistics, history, tasks] = await Promise.all([
      this.statistics(profile.id),
      this.attempts.history(profile.id),
      this.catalog.tasks(),
    ]);
    const initial = await this.db
      .from("study_sessions")
      .select("*")
      .eq("user_id", profile.id)
      .eq("week_start", week)
      .order("position");
    databaseError(initial.error);
    let sessions = initial.data;
    if (!sessions?.length) {
      const plan = new WeeklyPlanner().plan(
        profile,
        tasks,
        history.map((h) => h.taskId),
        statistics.skills,
        today,
      );
      if (plan.length) {
        const { error } = await this.db.from("study_sessions").upsert(
          plan.map((s) => ({
            user_id: profile.id,
            week_start: s.weekStart,
            scheduled_date: s.scheduledDate,
            task_id: s.taskId,
            planned_minutes: s.plannedMinutes,
            position: s.position,
          })),
          { onConflict: "user_id,week_start,position", ignoreDuplicates: true },
        );
        databaseError(error);
      }
      const response = await this.db
        .from("study_sessions")
        .select("*")
        .eq("user_id", profile.id)
        .eq("week_start", week)
        .order("position");
      databaseError(response.error);
      sessions = response.data;
    }
    const finishedIds = history
      .filter((a) => ["submitted", "completed"].includes(a.status))
      .map((a) => a.id);
    const completed =
      sessions?.filter(
        (s) =>
          s.attempt_id &&
          finishedIds.includes(s.attempt_id) &&
          s.status !== "completed",
      ) ?? [];
    if (completed.length) {
      databaseError(
        (
          await this.db
            .from("study_sessions")
            .update({ status: "completed" })
            .eq("user_id", profile.id)
            .in(
              "id",
              completed.map((s) => s.id),
            )
        ).error,
      );
      for (const row of completed) row.status = "completed";
    }
    const mapped = (sessions ?? [])
      .map((row) => ({
        ...camelRow(row),
        task: tasks.find((t) => t.id === row.task_id),
      }))
      .filter((s) => s.task) as unknown as StudySession[];
    const focus =
      statistics.skills
        .flatMap((s) => s.errors)
        .sort((a, b) => b.count - a.count)[0] ?? null;
    return {
      today,
      week,
      sessions: mapped,
      statistics,
      resume:
        history.find((a) => ["in_progress", "paused"].includes(a.status)) ??
        null,
      focus,
    };
  }
  async start(userId: string, id: string) {
    const session = await this.session(userId, id);
    const attempt = session.attempt_id
      ? await this.attempts.get(userId, session.attempt_id)
      : await this.attempts.create(userId, session.task_id, "practice");
    databaseError(
      (
        await this.db
          .from("study_sessions")
          .update({ attempt_id: attempt.id })
          .eq("user_id", userId)
          .eq("week_start", session.week_start)
          .eq("task_id", session.task_id)
          .in("status", ["planned", "started"])
      ).error,
    );
    databaseError(
      (
        await this.db
          .from("study_sessions")
          .update({
            status: ["submitted", "completed"].includes(attempt.status)
              ? "completed"
              : "started",
          })
          .eq("id", id)
          .eq("user_id", userId)
      ).error,
    );
    return attempt;
  }
  async move(userId: string, id: string, date: string) {
    await this.session(userId, id);
    databaseError(
      (
        await this.db
          .from("study_sessions")
          .update({ scheduled_date: date })
          .eq("id", id)
          .eq("user_id", userId)
          .eq("status", "planned")
      ).error,
    );
    return { saved: true };
  }
  private async session(userId: string, id: string) {
    const { data, error } = await this.db
      .from("study_sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    databaseError(error);
    if (!data) throw new AppError("NOT_FOUND", "Study session not found", 404);
    return data;
  }
}
