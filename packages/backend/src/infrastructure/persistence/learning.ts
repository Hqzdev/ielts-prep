import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LearningStore,
  StudySessionRecord,
} from "../../application/ports/learning";
import type { PlannedSession } from "../../domain/planner";
import { AppError } from "../../domain/errors";
import { camelRow, databaseError, mapAssessment } from "./mapping";

export class SupabaseLearningStore implements LearningStore {
  constructor(private readonly db: SupabaseClient) {}

  async assessments(userId: string) {
    const { data, error } = await this.db
      .from("assessments")
      .select("*")
      .eq("user_id", userId)
      .limit(5000);
    databaseError(error);
    return (data ?? []).map(mapAssessment);
  }

  async sessions(userId: string, week: string) {
    const { data, error } = await this.db
      .from("study_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start", week)
      .order("position");
    databaseError(error);
    return (data ?? []).map(
      (row) => camelRow(row) as unknown as StudySessionRecord,
    );
  }

  async createPlan(userId: string, plan: PlannedSession[]) {
    databaseError(
      (
        await this.db.from("study_sessions").upsert(
          plan.map((session) => ({
            user_id: userId,
            week_start: session.weekStart,
            scheduled_date: session.scheduledDate,
            task_id: session.taskId,
            planned_minutes: session.plannedMinutes,
            position: session.position,
          })),
          { onConflict: "user_id,week_start,position", ignoreDuplicates: true },
        )
      ).error,
    );
  }

  async completeSessions(userId: string, ids: string[]) {
    databaseError(
      (
        await this.db
          .from("study_sessions")
          .update({ status: "completed" })
          .eq("user_id", userId)
          .in("id", ids)
      ).error,
    );
  }

  async session(userId: string, id: string) {
    const { data, error } = await this.db
      .from("study_sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    databaseError(error);
    if (!data)
      throw new AppError("NOT_FOUND", "Study session not found", "not_found");
    return camelRow(data) as unknown as StudySessionRecord;
  }

  async attachAttempt(
    userId: string,
    session: StudySessionRecord,
    attemptId: string,
    completed: boolean,
  ) {
    databaseError(
      (
        await this.db
          .from("study_sessions")
          .update({ attempt_id: attemptId })
          .eq("user_id", userId)
          .eq("week_start", session.weekStart)
          .eq("task_id", session.taskId)
          .in("status", ["planned", "started"])
      ).error,
    );
    databaseError(
      (
        await this.db
          .from("study_sessions")
          .update({ status: completed ? "completed" : "started" })
          .eq("id", session.id)
          .eq("user_id", userId)
      ).error,
    );
  }

  async move(userId: string, id: string, date: string) {
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
  }

  async activityDates(userId: string) {
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
      if (!data || data.length < 1000) return dates;
    }
  }
}
