import "server-only";
import { getRun } from "workflow/api";
import { adminClient } from "../supabase";
import { databaseError } from "../repositories/mapping";

export class JobReconciliation {
  constructor(private readonly db = adminClient()) {}
  async reconcile() {
    const { data, error } = await this.db
      .from("assessment_jobs")
      .select("id,assessment_id,workflow_run_id")
      .in("state", ["dispatched", "processing"])
      .lt("updated_at", new Date(Date.now() - 15 * 60000).toISOString())
      .not("workflow_run_id", "is", null)
      .limit(20);
    databaseError(error);
    let recovered = 0;
    for (const job of data ?? []) {
      try {
        const run = getRun(job.workflow_run_id);
        const status = (await run.exists) ? await run.status : "missing";
        if (!["failed", "cancelled", "completed", "missing"].includes(status))
          continue;
        const { data: assessment } = await this.db
          .from("assessments")
          .select("status")
          .eq("id", job.assessment_id)
          .single();
        if (
          !assessment ||
          !["queued", "processing"].includes(assessment.status)
        )
          continue;
        databaseError(
          (
            await this.db
              .from("assessments")
              .update({
                status: "failed",
                error_code: "WORKFLOW_INTERRUPTED",
                completed_at: new Date().toISOString(),
              })
              .eq("id", job.assessment_id)
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
                updated_at: new Date().toISOString(),
              })
              .eq("id", job.id)
              .in("state", ["dispatched", "processing"])
          ).error,
        );
        recovered++;
      } catch {
        console.error(
          JSON.stringify({ event: "job_reconciliation_failed", jobId: job.id }),
        );
      }
    }
    return recovered;
  }
}
