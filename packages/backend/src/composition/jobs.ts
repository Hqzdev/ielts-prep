import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssessmentRunner } from "../application/ports/jobs";
import type { PracticeService } from "../application/services/practice";
import {
  AssessmentDispatch,
  JobReconciliation,
} from "../application/services/jobs";
import { MaintenanceService } from "../application/services/maintenance";
import {
  SupabaseAssessmentJobStore,
  SupabaseMaintenanceStore,
} from "../infrastructure/persistence/jobs";
import { SystemClock } from "../infrastructure/runtime";
import { JsonOperationalEvents } from "../infrastructure/operational-events";

export function createJobServices(
  db: SupabaseClient,
  runner: AssessmentRunner,
  practice: PracticeService,
) {
  const clock = new SystemClock();
  const events = new JsonOperationalEvents();
  const jobs = new SupabaseAssessmentJobStore(db);
  const dispatch = new AssessmentDispatch(jobs, runner, events);
  const reconciliation = new JobReconciliation(jobs, runner, clock, events);
  return {
    dispatch,
    maintenance: new MaintenanceService(
      new SupabaseMaintenanceStore(db),
      practice,
      dispatch,
      reconciliation,
      clock,
      events,
    ),
  };
}
