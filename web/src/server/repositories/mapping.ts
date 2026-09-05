import { taskSchema } from "@/domain/task";
import { answerSchema, type Attempt } from "@/domain/attempt";
import type { Assessment } from "@/domain/assessment";
import { ReadingBandCalculator } from "@/domain/reading-band";
import { AppError } from "@/domain/errors";

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
  const messages: Record<string, [string, number]> = {
    NOT_FOUND: ["Recording not found", 404],
    ATTEMPT_LOCKED: [
      "This answer has already been submitted and cannot be changed",
      409,
    ],
    DEADLINE_EXPIRED: ["Time has run out for this strict attempt", 409],
    REVISION_CONFLICT: ["A newer version was saved in another tab", 409],
    STRICT_PAUSE: ["Pausing is not available in strict mode", 400],
    ASSESSMENT_ACTIVE: ["Wait for your current assessment to finish", 429],
    DAILY_LIMIT: ["Daily limit reached. Try again tomorrow", 429],
  };
  const match = Object.entries(messages).find(([key]) =>
    error.message.includes(key),
  );
  if (match) throw new AppError(match[0], match[1][0], match[1][1]);
  throw new AppError("DATABASE_ERROR", "Could not save your data", 503);
}
