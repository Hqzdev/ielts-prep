import type { PracticeStore } from "../../application/ports/practice";
import type { SupabaseClient } from "@supabase/supabase-js";
import { databaseError, mapAttempt, mapAssessment } from "./mapping";
import { AppError } from "@veylo/backend/domain/errors";
import type {
  Answer,
  Attempt,
  AttemptMode,
} from "@veylo/backend/domain/attempt";
import type {
  Assessment,
  ReadingVerdict,
} from "@veylo/backend/domain/assessment";
import { ReadingBandCalculator } from "@veylo/backend/domain/reading-band";

export class PracticeRepository implements PracticeStore {
  constructor(
    private readonly db: SupabaseClient,
    private readonly readingBand = new ReadingBandCalculator(),
  ) {}

  async get(userId: string, id: string): Promise<Attempt> {
    const { data, error } = await this.db
      .from("attempts")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    databaseError(error);
    if (!data)
      throw new AppError("NOT_FOUND", "Attempt not found", "not_found");
    return mapAttempt(data);
  }

  async assessment(
    userId: string,
    attemptId: string,
  ): Promise<Assessment | null> {
    const { data, error } = await this.db
      .from("assessments")
      .select("*")
      .eq("attempt_id", attemptId)
      .eq("user_id", userId)
      .maybeSingle();
    databaseError(error);
    return data ? mapAssessment(data) : null;
  }

  async create(
    userId: string,
    taskId: string,
    mode: AttemptMode,
    parentId?: string,
  ): Promise<Attempt> {
    const { data, error } = await this.db.rpc("create_attempt", {
      p_user: userId,
      p_task: taskId,
      p_mode: mode,
      p_parent: parentId ?? null,
    });
    databaseError(error);
    return mapAttempt(data);
  }

  async save(
    userId: string,
    id: string,
    revision: number,
    answer: Answer,
    action?: "pause" | "resume",
  ): Promise<Attempt> {
    const { data, error } = await this.db.rpc("save_attempt", {
      p_user: userId,
      p_id: id,
      p_revision: revision,
      p_answer: answer,
      p_pause: action === "pause",
      p_resume: action === "resume",
    });
    databaseError(error);
    return mapAttempt(data);
  }

  async submit(
    userId: string,
    id: string,
    available: boolean,
    limit: number,
  ): Promise<Assessment> {
    const { data, error } = await this.db.rpc("submit_attempt", {
      p_user: userId,
      p_id: id,
      p_available: available,
      p_daily_limit: limit,
    });
    databaseError(error);
    return mapAssessment(data);
  }

  async finishReading(
    assessment: Assessment,
    verdicts: ReadingVerdict[],
  ): Promise<Assessment> {
    const { error } = await this.db
      .from("assessments")
      .update({
        status: "ready",
        reading: verdicts,
        band: this.readingBand.calculate(verdicts),
        completed_at: new Date().toISOString(),
        rubric_version: ReadingBandCalculator.version,
      })
      .eq("id", assessment.id)
      .eq("status", "queued");
    databaseError(error);
    databaseError(
      (
        await this.db
          .from("attempts")
          .update({ status: "completed" })
          .eq("id", assessment.attemptId)
      ).error,
    );
    return (await this.assessment(assessment.userId, assessment.attemptId))!;
  }

  async retry(userId: string, id: string, limit: number): Promise<Assessment> {
    const { data, error } = await this.db.rpc("retry_assessment", {
      p_user: userId,
      p_attempt: id,
      p_daily_limit: limit,
    });
    databaseError(error);
    return mapAssessment(data);
  }

  async history(userId: string): Promise<Attempt[]> {
    const { data, error } = await this.db
      .from("attempts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5000);
    databaseError(error);
    return (data ?? []).map(mapAttempt);
  }
}
