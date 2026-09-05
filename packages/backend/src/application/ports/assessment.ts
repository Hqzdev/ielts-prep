import type { Assessment, Grade, Transcript } from "../../domain/assessment";
import type { AssessmentPolicy } from "./runtime";

export interface EvaluationStore {
  assessment(id: string): Promise<Assessment>;
  begin(id: string, attempt: number, now: Date): Promise<void>;
  complete(
    assessment: Assessment,
    grade: Grade,
    transcripts: Transcript[],
    band: number | null,
    model: string,
    now: Date,
  ): Promise<void>;
  finalize(assessment: Assessment, now: Date): Promise<void>;
  recordError(id: string, code: string): Promise<void>;
  fail(id: string, now: Date): Promise<void>;
}

export interface AssessmentSettings extends AssessmentPolicy {
  readonly textModel: string;
  readonly audioModel: string;
}

export interface ProviderFailurePolicy {
  classify(error: unknown): { code: string; retryable: boolean };
}
