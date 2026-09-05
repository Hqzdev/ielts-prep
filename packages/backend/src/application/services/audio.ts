import { AppError } from "../../domain/errors";
import { WavCodec } from "../../domain/wav";
import type { PracticeStore } from "../ports/practice";
import type { AudioStorage, RecordingStore } from "../ports/audio";
import type { Clock, IdentifierSource } from "../ports/runtime";
import type { SpeechService } from "./speech";

export class AudioService {
  constructor(
    private readonly recordings: RecordingStore,
    private readonly storage: AudioStorage,
    private readonly attempts: PracticeStore,
    private readonly speech: SpeechService,
    private readonly clock: Clock,
    private readonly ids: IdentifierSource,
  ) {}

  list(userId: string) {
    return this.recordings.list(userId, this.clock.now());
  }

  async ticket(
    userId: string,
    attemptId: string,
    questionIndex: number,
    bytes: number,
  ) {
    const attempt = await this.attempts.get(userId, attemptId);
    if (
      attempt.taskSnapshot.skill !== "speaking" ||
      !["in_progress", "paused"].includes(attempt.status)
    )
      throw new AppError(
        "ATTEMPT_LOCKED",
        "Recording is not available for this attempt",
        "conflict",
      );
    if (questionIndex >= attempt.taskSnapshot.speakingQuestions.length)
      throw new AppError("INVALID_QUESTION", "Question not found");
    if (
      attempt.mode === "strict" &&
      attempt.deadlineAt &&
      Date.parse(attempt.deadlineAt) < this.clock.now().getTime() - 15000
    )
      throw new AppError(
        "DEADLINE_EXPIRED",
        "Recording time has run out",
        "conflict",
      );
    if ((await this.recordings.count(attemptId)) >= 40)
      throw new AppError(
        "AUDIO_LIMIT",
        "You have reached the recording limit for this attempt",
        "limited",
      );
    const id = this.ids.create();
    const path = `${userId}/${attemptId}/${id}.wav`;
    await this.recordings.create({
      id,
      userId,
      attemptId,
      questionIndex,
      path,
      bytes,
    });
    return {
      id,
      path,
      token: await this.storage.uploadTicket("speaking", path),
    };
  }

  async complete(userId: string, id: string) {
    const asset = await this.recordings.asset(userId, id);
    if (asset.state === "ready") {
      if (asset.duration === null)
        throw new AppError(
          "INVALID_AUDIO",
          "Recording duration is unavailable",
        );
      return { id, duration: asset.duration };
    }
    if (asset.state !== "pending")
      throw new AppError("AUDIO_UNAVAILABLE", "Recording deleted", "expired");
    const data = await this.storage.download("speaking", asset.path);
    if (data.byteLength > 20971520 || data.byteLength !== asset.bytes)
      throw new AppError(
        "INVALID_AUDIO",
        "The audio size does not match the upload",
      );
    let duration: number;
    try {
      const info = new WavCodec().inspect(Uint8Array.from(data).buffer);
      if (info.sampleRate !== 16000) throw new Error("RATE");
      duration = info.duration;
    } catch {
      throw new AppError(
        "INVALID_AUDIO",
        "The recording must be WAV PCM, mono, 16 kHz",
      );
    }
    if (duration < 0.3 || duration > 600)
      throw new AppError(
        "INVALID_AUDIO_DURATION",
        "Invalid recording duration",
      );
    await this.recordings.ready(userId, id, duration);
    return { id, duration };
  }

  async playback(userId: string, id: string) {
    const asset = await this.recordings.asset(userId, id);
    if (
      asset.state !== "ready" ||
      Date.parse(asset.expiresAt) <= this.clock.now().getTime()
    )
      throw new AppError(
        "AUDIO_EXPIRED",
        "The recording's storage period has expired",
        "expired",
      );
    return {
      url: await this.storage.signedUrl("speaking", asset.path, 300),
      duration: asset.duration,
      expiresAt: asset.expiresAt,
    };
  }

  async remove(userId: string, id: string) {
    const asset = await this.recordings.asset(userId, id);
    await this.storage.remove("speaking", asset.path);
    await this.recordings.remove(userId, id);
    return { deleted: true };
  }

  question(text: string) {
    return this.speech.question(text);
  }
}
