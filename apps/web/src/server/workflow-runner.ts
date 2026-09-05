import { start, getRun } from "workflow/api";
import type { AssessmentRunner } from "@veylo/backend/application/ports/jobs";
import { assessAttempt } from "@/workflows/assessment";

export class WorkflowAssessmentRunner implements AssessmentRunner {
  async start(assessmentId: string) {
    return (await start(assessAttempt, [assessmentId])).runId;
  }

  async status(runId: string) {
    const run = getRun(runId);
    return (await run.exists) ? await run.status : "missing";
  }
}
