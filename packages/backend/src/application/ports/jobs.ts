export interface AssessmentJob {
  id: string;
  assessmentId: string;
  workflowRunId: string | null;
}

export interface AssessmentJobStore {
  claim(): Promise<AssessmentJob[]>;
  dispatched(id: string, runId: string): Promise<void>;
  stale(before: Date): Promise<AssessmentJob[]>;
  recover(job: AssessmentJob, now: Date): Promise<boolean>;
}

export interface AssessmentRunner {
  start(assessmentId: string): Promise<string>;
  status(runId: string): Promise<string>;
}

export interface OperationalEvents {
  failed(event: string, identifiers: Record<string, string>): void;
  record(event: string, measurements: Record<string, number>): void;
}

export interface MaintenanceStore {
  expireAudio(now: Date): Promise<number>;
  expiredAttempts(now: Date): Promise<{ id: string; userId: string }[]>;
}
