import type {
  AssessmentJobStore,
  AssessmentRunner,
  OperationalEvents,
} from "../ports/jobs";
import type { Clock } from "../ports/runtime";

export class AssessmentDispatch {
  constructor(
    private readonly store: AssessmentJobStore,
    private readonly runner: AssessmentRunner,
    private readonly events: OperationalEvents,
  ) {}

  async dispatch() {
    const jobs = await this.store.claim();
    let dispatched = 0;
    for (const job of jobs) {
      try {
        await this.store.dispatched(
          job.id,
          await this.runner.start(job.assessmentId),
        );
        dispatched++;
      } catch {
        this.events.failed("assessment_dispatch_failed", { jobId: job.id });
      }
    }
    this.events.record("assessment_queue_dispatch", {
      claimed: jobs.length,
      dispatched,
      failed: jobs.length - dispatched,
    });
  }
}

export class JobReconciliation {
  constructor(
    private readonly store: AssessmentJobStore,
    private readonly runner: AssessmentRunner,
    private readonly clock: Clock,
    private readonly events: OperationalEvents,
  ) {}

  async reconcile() {
    const jobs = await this.store.stale(
      new Date(this.clock.now().getTime() - 15 * 60000),
    );
    let recovered = 0;
    for (const job of jobs) {
      try {
        if (!job.workflowRunId) continue;
        const status = await this.runner.status(job.workflowRunId);
        if (!["failed", "cancelled", "completed", "missing"].includes(status))
          continue;
        if (await this.store.recover(job, this.clock.now())) recovered++;
      } catch {
        this.events.failed("job_reconciliation_failed", { jobId: job.id });
      }
    }
    this.events.record("assessment_queue_reconcile", {
      stale: jobs.length,
      recovered,
    });
    return recovered;
  }
}
