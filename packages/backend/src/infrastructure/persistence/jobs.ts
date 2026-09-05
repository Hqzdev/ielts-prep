import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AssessmentJob,
  AssessmentJobStore,
  MaintenanceStore,
} from "../../application/ports/jobs";
import { databaseError, camelRow } from "./mapping";

export class SupabaseAssessmentJobStore implements AssessmentJobStore {
  constructor(private readonly db: SupabaseClient) {}

  async claim() {
    const { data, error } = await this.db.rpc("claim_assessment_jobs");
    databaseError(error);
    return (data ?? []).map((row: Record<string, unknown>) =>
      camelRow(row),
    ) as AssessmentJob[];
  }

  async dispatched(id: string, runId: string) {
    databaseError(
      (
        await this.db
          .from("assessment_jobs")
          .update({
            state: "dispatched",
            workflow_run_id: runId,
            leased_until: null,
          })
          .eq("id", id)
          .eq("state", "pending")
      ).error,
    );
  }

  async stale(before: Date) {
    const { data, error } = await this.db
      .from("assessment_jobs")
      .select("id,assessment_id,workflow_run_id")
      .in("state", ["dispatched", "processing"])
      .lt("updated_at", before.toISOString())
      .not("workflow_run_id", "is", null)
      .limit(20);
    databaseError(error);
    return (data ?? []).map((row) =>
      camelRow(row),
    ) as unknown as AssessmentJob[];
  }

  async recover(job: AssessmentJob, now: Date) {
    const { data, error } = await this.db
      .from("assessments")
      .select("status")
      .eq("id", job.assessmentId)
      .single();
    databaseError(error);
    if (!data || !["queued", "processing"].includes(data.status)) return false;
    databaseError(
      (
        await this.db
          .from("assessments")
          .update({
            status: "failed",
            error_code: "WORKFLOW_INTERRUPTED",
            completed_at: now.toISOString(),
          })
          .eq("id", job.assessmentId)
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
          .eq("id", job.id)
          .in("state", ["dispatched", "processing"])
      ).error,
    );
    return true;
  }
}

export class SupabaseMaintenanceStore implements MaintenanceStore {
  constructor(private readonly db: SupabaseClient) {}

  async expireAudio(now: Date) {
    const { data, error } = await this.db
      .from("audio_assets")
      .select("id,path")
      .neq("state", "deleted")
      .lt("expires_at", now.toISOString())
      .limit(100);
    databaseError(error);
    if (!data?.length) return 0;
    databaseError(
      (
        await this.db.storage
          .from("speaking")
          .remove(data.map((asset) => asset.path))
      ).error,
    );
    databaseError(
      (
        await this.db
          .from("audio_assets")
          .update({ state: "deleted" })
          .in(
            "id",
            data.map((asset) => asset.id),
          )
      ).error,
    );
    return data.length;
  }

  async expiredAttempts(now: Date) {
    const { data, error } = await this.db
      .from("attempts")
      .select("id,user_id")
      .eq("mode", "strict")
      .eq("status", "in_progress")
      .lte("deadline_at", now.toISOString())
      .limit(50);
    databaseError(error);
    return (data ?? []).map((row) => ({
      id: row.id as string,
      userId: row.user_id as string,
    }));
  }
}
