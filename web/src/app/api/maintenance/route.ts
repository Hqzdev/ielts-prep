import { timingSafeEqual } from "node:crypto";
import { handle } from "@/server/http";
import { adminClient } from "@/server/supabase";
import { AppError } from "@/domain/errors";
import { dispatchAssessments } from "@/server/services/dispatch";
import { PracticeService } from "@/server/services/practice";
import { databaseError } from "@/server/repositories/mapping";
import { JobReconciliation } from "@/server/services/job-reconciliation";
export const maxDuration = 300;
export async function GET(request: Request) {
  return handle(async () => {
    const secret = process.env.CRON_SECRET;
    const supplied = request.headers.get("authorization") ?? "";
    const expected = `Bearer ${secret}`;
    if (
      !secret ||
      supplied.length !== expected.length ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
    )
      throw new AppError(
        "FORBIDDEN",
        "You don't have permission to do this",
        403,
      );
    const db = adminClient();
    const now = new Date().toISOString();
    const expired = await db
      .from("audio_assets")
      .select("id,path")
      .neq("state", "deleted")
      .lt("expires_at", now)
      .limit(100);
    databaseError(expired.error);
    if (expired.data?.length) {
      databaseError(
        (
          await db.storage
            .from("speaking")
            .remove(expired.data.map((a) => a.path))
        ).error,
      );
      databaseError(
        (
          await db
            .from("audio_assets")
            .update({ state: "deleted" })
            .in(
              "id",
              expired.data.map((a) => a.id),
            )
        ).error,
      );
    }
    const strict = await db
      .from("attempts")
      .select("id,user_id")
      .eq("mode", "strict")
      .eq("status", "in_progress")
      .lte("deadline_at", now)
      .limit(50);
    databaseError(strict.error);
    for (const attempt of strict.data ?? []) {
      try {
        await new PracticeService().submit(attempt.user_id, attempt.id);
      } catch {
        console.error(
          JSON.stringify({
            event: "strict_submit_failed",
            attemptId: attempt.id,
          }),
        );
      }
    }
    await dispatchAssessments();
    const reconciledJobs = await new JobReconciliation(db).reconcile();
    return {
      expiredAudio: expired.data?.length ?? 0,
      strictAttempts: strict.data?.length ?? 0,
      reconciledJobs,
    };
  });
}
