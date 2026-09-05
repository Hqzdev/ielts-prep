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
  const [
    { adminClient },
    { mapAttempt },
    { GeminiProvider },
    { config },
    { BandCalculator },
  ] = await Promise.all([
    import("@/server/supabase"),
    import("@/server/repositories/mapping"),
    import("@/server/services/gemini"),
    import("@/server/config"),
    import("@/domain/assessment"),
  ]);
  const db = adminClient();
  const { data: assessment, error } = await db
    .from("assessments")
    .select("*")
    .eq("id", assessmentId)
    .single();
  if (error)
    throw new RetryableError("ASSESSMENT_READ_FAILED", { retryAfter: "10s" });
  if (!["queued", "processing"].includes(assessment.status)) return;
  const { data: raw } = await db
    .from("attempts")
    .select("*")
    .eq("id", assessment.attempt_id)
    .single();
  if (!raw) throw new FatalError("ATTEMPT_MISSING");
  const attempt = mapAttempt(raw);
  if (
    attempt.taskSnapshot.skill === "reading" ||
    !config.canAssess(attempt.taskSnapshot.skill)
  )
    throw new FatalError("AI_UNAVAILABLE");
  await db
    .from("assessments")
    .update({ status: "processing" })
    .eq("id", assessmentId);
  await db
    .from("assessment_jobs")
    .update({
      state: "processing",
      tries: getStepMetadata().attempt,
      updated_at: new Date().toISOString(),
    })
    .eq("assessment_id", assessmentId);
  try {
    const audio = [];
    for (const id of attempt.answer.audioIds) {
      const { data: asset } = await db
        .from("audio_assets")
        .select("*")
        .eq("id", id)
        .eq("user_id", attempt.userId)
        .eq("state", "ready")
        .gt("expires_at", new Date().toISOString())
        .single();
      if (!asset) throw new FatalError("AUDIO_UNAVAILABLE");
      const { data: blob, error: downloadError } = await db.storage
        .from("speaking")
        .download(asset.path);
      if (downloadError || !blob)
        throw new RetryableError("AUDIO_DOWNLOAD_FAILED", {
          retryAfter: "15s",
        });
      audio.push({
        id,
        duration: asset.duration,
        questionIndex: asset.question_index,
        base64: Buffer.from(await blob.arrayBuffer()).toString("base64"),
      });
    }
    const provider = new GeminiProvider({
      key: config.geminiKey,
      textModel: config.textModel,
      audioModel: config.audioModel,
      ttsModel: config.ttsModel,
      voice: config.voice,
    });
    const transcripts = [];
    for (const recording of audio)
      transcripts.push(await provider.transcribe(recording));
    const grade = await provider.assess(attempt, audio, transcripts);
    const result = await db
      .from("assessments")
      .update({
        status: grade.sufficientEvidence ? "ready" : "insufficient_evidence",
        grade,
        transcripts,
        band: grade.sufficientEvidence
          ? new BandCalculator().calculate(grade.criteria.map((c) => c.score))
          : null,
        model:
          attempt.taskSnapshot.skill === "speaking"
            ? config.audioModel
            : config.textModel,
        rubric_version: "ielts-academic-practice-v2-en",
        error_code: null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", assessmentId)
      .in("status", ["queued", "processing"]);
    if (result.error)
      throw new RetryableError("RESULT_SAVE_FAILED", { retryAfter: "10s" });
    await db
      .from("attempts")
      .update({ status: "completed" })
      .eq("id", attempt.id);
    await db
      .from("assessment_jobs")
      .update({
        state: "completed",
        leased_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq("assessment_id", assessmentId);
  } catch (error) {
    if (error instanceof FatalError || error instanceof RetryableError)
      throw error;
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? Number(error.status)
        : 0;
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "PROVIDER_ERROR";
    await db
      .from("assessments")
      .update({ error_code: code })
      .eq("id", assessmentId);
    if (
      [400, 401, 403, 404].includes(status) ||
      code.startsWith("INVALID_AI") ||
      error instanceof SyntaxError
    )
      throw new FatalError(code);
    throw new RetryableError(code, {
      retryAfter: `${getStepMetadata().attempt * 15}s`,
    });
  }
}
evaluate.maxRetries = 2;

async function markFailed(assessmentId: string) {
  "use step";
  const { adminClient } = await import("@/server/supabase");
  const db = adminClient();
  await db
    .from("assessments")
    .update({ status: "failed", completed_at: new Date().toISOString() })
    .eq("id", assessmentId)
    .in("status", ["queued", "processing"]);
  await db
    .from("assessment_jobs")
    .update({
      state: "failed",
      leased_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq("assessment_id", assessmentId)
    .neq("state", "completed");
}
