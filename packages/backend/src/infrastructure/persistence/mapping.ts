import { taskSchema } from "@veylo/contracts/schemas/task";
import { answerSchema } from "@veylo/contracts/schemas/attempt";
import { type Attempt } from "@veylo/backend/domain/attempt";
import type { Assessment } from "@veylo/backend/domain/assessment";
import { ReadingBandCalculator } from "@veylo/backend/domain/reading-band";
import { AppError, type FailureKind } from "@veylo/backend/domain/errors";

export function camelRow(
  row: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
      value,
    ]),
  );
}

export function mapAttempt(row: Record<string, unknown>): Attempt {
  const mapped = camelRow(row);
  return {
    ...mapped,
    taskSnapshot: taskSchema.parse(row.task_snapshot),
    answer: answerSchema.parse(row.answer),
  } as unknown as Attempt;
}

export function mapAssessment(row: Record<string, unknown>): Assessment {
  const assessment = camelRow(row) as unknown as Assessment;
  if (
    assessment.status === "ready" &&
    assessment.band === null &&
    assessment.reading
  ) {
    return {
      ...assessment,
      band: new ReadingBandCalculator().calculate(assessment.reading),
    };
  }
  return assessment;
}

export function databaseError(
  error: { message: string; code?: string } | null,
): void {
  if (!error) return;
  const messages: Record<string, [string, FailureKind]> = {
    NOT_FOUND: ["Recording not found", "not_found"],
    ATTEMPT_LOCKED: [
      "This answer has already been submitted and cannot be changed",
      "conflict",
    ],
    DEADLINE_EXPIRED: ["Time has run out for this strict attempt", "conflict"],
    REVISION_CONFLICT: ["A newer version was saved in another tab", "conflict"],
    STRICT_PAUSE: ["Pausing is not available in strict mode", "invalid"],
    ASSESSMENT_ACTIVE: [
      "Wait for your current assessment to finish",
      "limited",
    ],
    DAILY_LIMIT: ["Daily limit reached. Try again tomorrow", "limited"],
  };
  const match = Object.entries(messages).find(([key]) =>
    error.message.includes(key),
  );
  if (match) throw new AppError(match[0], match[1][0], match[1][1]);
  throw new AppError(
    "DATABASE_ERROR",
    "Could not save your data",
    "unavailable",
  );
}
