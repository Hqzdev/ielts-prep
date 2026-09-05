import type { SupabaseClient } from "@supabase/supabase-js";
import type { EvaluationStore } from "../../application/ports/assessment";
import type { Assessment, Grade, Transcript } from "../../domain/assessment";
import { databaseError, mapAssessment } from "./mapping";

export class SupabaseEvaluationStore implements EvaluationStore {
  constructor(private readonly db: SupabaseClient) {}

  async assessment(id: string) {
    const { data, error } = await this.db
      .from("assessments")
      .select("*")
      .eq("id", id)
      .single();
    databaseError(error);
    return mapAssessment(data!);
  }

  async begin(id: string, attempt: number, now: Date) {
    databaseError(
      (
        await this.db
          .from("assessments")
          .update({ status: "processing" })
          .eq("id", id)
          .in("status", ["queued", "processing"])
      ).error,
    );
    databaseError(
      (
        await this.db
          .from("assessment_jobs")
          .update({
            state: "processing",
            tries: attempt,
            updated_at: now.toISOString(),
          })
          .eq("assessment_id", id)
      ).error,
    );
  }

  async complete(
    assessment: Assessment,
    grade: Grade,
    transcripts: Transcript[],
    band: number | null,
    model: string,
    now: Date,
  ) {
    databaseError(
      (
        await this.db
          .from("assessments")
          .update({
            status: grade.sufficientEvidence
              ? "ready"
              : "insufficient_evidence",
            grade,
            transcripts,
            band,
            model,
            rubric_version: "ielts-academic-practice-v2-en",
            error_code: null,
            completed_at: now.toISOString(),
          })
          .eq("id", assessment.id)
          .in("status", ["queued", "processing"])
      ).error,
    );
    await this.finalize(assessment, now);
  }

  async finalize(assessment: Assessment, now: Date) {
    databaseError(
      (
        await this.db
          .from("attempts")
          .update({ status: "completed" })
          .eq("id", assessment.attemptId)
      ).error,
    );
    databaseError(
      (
        await this.db
          .from("assessment_jobs")
          .update({
            state: "completed",
            leased_until: null,
            updated_at: now.toISOString(),
          })
          .eq("assessment_id", assessment.id)
      ).error,
    );
  }

  async recordError(id: string, code: string) {
    databaseError(
      (
        await this.db
          .from("assessments")
          .update({ error_code: code })
          .eq("id", id)
      ).error,
    );
  }

  async fail(id: string, now: Date) {
    databaseError(
      (
        await this.db
          .from("assessments")
          .update({ status: "failed", completed_at: now.toISOString() })
          .eq("id", id)
          .in("status", ["queued", "processing"])
      ).error,
    );
    databaseError(
      (
        await this.db
          .from("assessment_jobs")
          .update({
            state: "failed",
            leased_until: null,
            updated_at: now.toISOString(),
          })
          .eq("assessment_id", id)
          .neq("state", "completed")
      ).error,
    );
  }
}
