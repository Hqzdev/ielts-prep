import "server-only";
import { start } from "workflow/api";
import { assessAttempt } from "@/workflows/assessment";
import { adminClient } from "../supabase";
import { databaseError } from "../repositories/mapping";

export async function dispatchAssessments() {
  const db = adminClient();
  const { data, error } = await db.rpc("claim_assessment_jobs");
  databaseError(error);
  for (const job of data ?? []) {
    try {
      const run = await start(assessAttempt, [job.assessment_id]);
      databaseError(
        (
          await db
            .from("assessment_jobs")
            .update({
              state: "dispatched",
              workflow_run_id: run.runId,
              leased_until: null,
            })
            .eq("id", job.id)
            .eq("state", "pending")
        ).error,
      );
    } catch {
      console.error(
        JSON.stringify({ event: "assessment_dispatch_failed", jobId: job.id }),
      );
    }
  }
}
