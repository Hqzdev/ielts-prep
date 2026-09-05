import type { MaintenanceStore, OperationalEvents } from "../ports/jobs";
import type { Clock } from "../ports/runtime";
import type { PracticeService } from "./practice";
import type { AssessmentDispatch, JobReconciliation } from "./jobs";

export class MaintenanceService {
  constructor(
    private readonly store: MaintenanceStore,
    private readonly practice: PracticeService,
    private readonly dispatch: AssessmentDispatch,
    private readonly reconciliation: JobReconciliation,
    private readonly clock: Clock,
    private readonly events: OperationalEvents,
  ) {}

  async run() {
    const now = this.clock.now();
    const expiredAudio = await this.store.expireAudio(now);
    const attempts = await this.store.expiredAttempts(now);
    for (const attempt of attempts) {
      try {
        await this.practice.submit(attempt.userId, attempt.id);
      } catch {
        this.events.failed("strict_submit_failed", { attemptId: attempt.id });
      }
    }
    await this.dispatch.dispatch();
    return {
      expiredAudio,
      strictAttempts: attempts.length,
      reconciledJobs: await this.reconciliation.reconcile(),
    };
  }
}
