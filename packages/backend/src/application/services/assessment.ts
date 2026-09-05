import { BandCalculator } from "../../domain/assessment";
import type { Transcript, Assessment } from "../../domain/assessment";
import type {
  EvaluationStore,
  AssessmentSettings,
  ProviderFailurePolicy,
} from "../ports/assessment";
import type { AiProviderSource, AudioInput } from "../ports/ai";
import type { PracticeStore } from "../ports/practice";
import type { RecordingStore, AudioStorage } from "../ports/audio";
import type { Clock, ContentEncoding } from "../ports/runtime";

export class EvaluationFailure extends Error {
  constructor(
    public readonly code: string,
    public readonly retryable: boolean,
    public readonly delaySeconds = 10,
  ) {
    super(code);
    this.name = "EvaluationFailure";
  }
}

export class AssessmentService {
  constructor(
    private readonly store: EvaluationStore,
    private readonly attempts: PracticeStore,
    private readonly recordings: RecordingStore,
    private readonly storage: AudioStorage,
    private readonly ai: AiProviderSource,
    private readonly policy: AssessmentSettings,
    private readonly failures: ProviderFailurePolicy,
    private readonly clock: Clock,
    private readonly encoding: ContentEncoding,
  ) {}

  async evaluate(id: string, tryNumber: number) {
    let assessment: Assessment;
    try {
      assessment = await this.store.assessment(id);
    } catch {
      throw new EvaluationFailure("ASSESSMENT_READ_FAILED", true);
    }
    if (["ready", "insufficient_evidence"].includes(assessment.status)) {
      await this.store.finalize(assessment, this.clock.now());
      return;
    }
    if (!["queued", "processing"].includes(assessment.status)) return;
    const attempt = await this.attempts
      .get(assessment.userId, assessment.attemptId)
      .catch(() => {
        throw new EvaluationFailure("ATTEMPT_MISSING", false);
      });
    const skill = attempt.taskSnapshot.skill;
    if (skill === "reading" || !this.policy.canAssess(skill))
      throw new EvaluationFailure("AI_UNAVAILABLE", false);
    await this.store.begin(id, tryNumber, this.clock.now());
    try {
      const audio: AudioInput[] = [];
      for (const audioId of attempt.answer.audioIds)
        audio.push(await this.recording(attempt.userId, attempt.id, audioId));
      const provider = this.ai.provider();
      const transcripts: Transcript[] = [];
      for (const recording of audio)
        transcripts.push(await provider.transcribe(recording));
      const grade = await provider.assess(attempt, audio, transcripts);
      const band = grade.sufficientEvidence
        ? new BandCalculator().calculate(
            grade.criteria.map((criterion) => criterion.score),
          )
        : null;
      try {
        await this.store.complete(
          assessment,
          grade,
          transcripts,
          band,
          skill === "speaking" ? this.policy.audioModel : this.policy.textModel,
          this.clock.now(),
        );
      } catch {
        throw new EvaluationFailure("RESULT_SAVE_FAILED", true);
      }
    } catch (error) {
      if (error instanceof EvaluationFailure) throw error;
      const failure = this.failures.classify(error);
      await this.store.recordError(id, failure.code);
      throw new EvaluationFailure(
        failure.code,
        failure.retryable,
        tryNumber * 15,
      );
    }
  }

  fail(id: string) {
    return this.store.fail(id, this.clock.now());
  }

  private async recording(
    userId: string,
    attemptId: string,
    id: string,
  ): Promise<AudioInput> {
    const asset = await this.recordings.asset(userId, id).catch(() => {
      throw new EvaluationFailure("AUDIO_UNAVAILABLE", false);
    });
    if (
      asset.attemptId !== attemptId ||
      asset.state !== "ready" ||
      !asset.duration ||
      Date.parse(asset.expiresAt) <= this.clock.now().getTime()
    )
      throw new EvaluationFailure("AUDIO_UNAVAILABLE", false);
    let bytes: Uint8Array;
    try {
      bytes = await this.storage.download("speaking", asset.path);
    } catch {
      throw new EvaluationFailure("AUDIO_DOWNLOAD_FAILED", true, 15);
    }
    return {
      id,
      duration: asset.duration,
      questionIndex: asset.questionIndex,
      base64: this.encoding.base64(bytes),
    };
  }
}
