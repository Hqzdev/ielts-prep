import {
  createHook,
  FatalError,
  RetryableError,
  getStepMetadata,
} from "workflow";

export async function assessAttempt(assessmentId: string) {
  "use workflow";
  using ownership = createHook({ token: `assessment:${assessmentId}` });
  if (await ownership.getConflict()) return;
  try {
    await evaluate(assessmentId);
  } catch {
    await markFailed(assessmentId);
  }
}

async function evaluate(assessmentId: string) {
  "use step";
  const [{ backend }, { EvaluationFailure }] = await Promise.all([
    import("@/server/backend"),
    import("@veylo/backend/application/services/assessment"),
  ]);
  try {
    await backend().assessment.evaluate(
      assessmentId,
      getStepMetadata().attempt,
    );
  } catch (error) {
    if (!(error instanceof EvaluationFailure)) throw error;
    if (!error.retryable) throw new FatalError(error.code);
    throw new RetryableError(error.code, {
      retryAfter: `${error.delaySeconds}s`,
    });
  }
}
evaluate.maxRetries = 2;

async function markFailed(assessmentId: string) {
  "use step";
  const { backend } = await import("@/server/backend");
  await backend().assessment.fail(assessmentId);
}
