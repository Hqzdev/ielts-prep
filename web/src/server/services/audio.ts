import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { adminClient } from "../supabase";
import { PracticeRepository } from "../repositories/practice";
import { databaseError } from "../repositories/mapping";
import { AppError } from "@/domain/errors";
import { WavCodec } from "@/domain/wav";
import { GeminiProvider } from "./gemini";
import { config } from "../config";

export class AudioService {
  constructor(
    private readonly db = adminClient(),
    private readonly attempts = new PracticeRepository(),
  ) {}

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
        409,
      );
    if (questionIndex >= attempt.taskSnapshot.speakingQuestions.length)
      throw new AppError("INVALID_QUESTION", "Question not found");
    if (
      attempt.mode === "strict" &&
      attempt.deadlineAt &&
      Date.parse(attempt.deadlineAt) < Date.now() - 15000
    )
      throw new AppError("DEADLINE_EXPIRED", "Recording time has run out", 409);
    const { count } = await this.db
      .from("audio_assets")
      .select("id", { count: "exact", head: true })
      .eq("attempt_id", attemptId)
      .neq("state", "deleted");
    if ((count ?? 0) >= 40)
      throw new AppError(
        "AUDIO_LIMIT",
        "You have reached the recording limit for this attempt",
        429,
      );
    const id = randomUUID();
    const path = `${userId}/${attemptId}/${id}.wav`;
    databaseError(
      (
        await this.db.from("audio_assets").insert({
          id,
          user_id: userId,
          attempt_id: attemptId,
          question_index: questionIndex,
          path,
          bytes,
        })
      ).error,
    );
    const { data, error } = await this.db.storage
      .from("speaking")
      .createSignedUploadUrl(path);
    databaseError(error);
    return { id, path, token: data!.token };
  }

  async complete(userId: string, id: string) {
    const asset = await this.asset(userId, id);
    if (asset.state === "ready") return { id, duration: asset.duration };
    if (asset.state !== "pending")
      throw new AppError("AUDIO_UNAVAILABLE", "Recording deleted", 410);
    const { data, error } = await this.db.storage
      .from("speaking")
      .download(asset.path);
    databaseError(error);
    if (!data || data.size > 20971520 || data.size !== asset.bytes)
      throw new AppError(
        "INVALID_AUDIO",
        "The audio size does not match the upload",
      );
    let duration: number;
    try {
      const info = new WavCodec().inspect(await data.arrayBuffer());
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
    databaseError(
      (
        await this.db
          .from("audio_assets")
          .update({ state: "ready", duration })
          .eq("id", id)
          .eq("user_id", userId)
      ).error,
    );
    return { id, duration };
  }

  async playback(userId: string, id: string) {
    const asset = await this.asset(userId, id);
    if (asset.state !== "ready" || Date.parse(asset.expires_at) <= Date.now())
      throw new AppError(
        "AUDIO_EXPIRED",
        "The recording's storage period has expired",
        410,
      );
    const { data, error } = await this.db.storage
      .from("speaking")
      .createSignedUrl(asset.path, 300);
    databaseError(error);
    return {
      url: data!.signedUrl,
      duration: asset.duration,
      expiresAt: asset.expires_at,
    };
  }

  async remove(userId: string, id: string) {
    const asset = await this.asset(userId, id);
    databaseError(
      (await this.db.storage.from("speaking").remove([asset.path])).error,
    );
    databaseError(
      (
        await this.db
          .from("audio_assets")
          .update({ state: "deleted" })
          .eq("id", id)
          .eq("user_id", userId)
      ).error,
    );
    return { deleted: true };
  }

  async question(text: string) {
    const cacheKey = createHash("sha256")
      .update(`${config.ttsModel}|${config.voice}|${text}`)
      .digest("hex");
    const path = `questions/${cacheKey}.wav`;
    const { data: cached } = await this.db
      .from("speech_assets")
      .select("path")
      .eq("cache_key", cacheKey)
      .maybeSingle();
    if (!cached) {
      const provider = new GeminiProvider({
        key: config.geminiKey,
        textModel: config.textModel,
        audioModel: config.audioModel,
        ttsModel: config.ttsModel,
        voice: config.voice,
      });
      const audio = await provider.speak(text);
      const upload = await this.db.storage
        .from("examiner")
        .upload(path, audio, { contentType: "audio/wav", upsert: true });
      databaseError(upload.error);
      databaseError(
        (
          await this.db
            .from("speech_assets")
            .upsert({ cache_key: cacheKey, path, model: config.ttsModel })
        ).error,
      );
    }
    const { data, error } = await this.db.storage
      .from("examiner")
      .createSignedUrl(path, 1800);
    databaseError(error);
    return { url: data!.signedUrl };
  }

  private async asset(userId: string, id: string) {
    const { data, error } = await this.db
      .from("audio_assets")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    databaseError(error);
    if (!data) throw new AppError("NOT_FOUND", "Recording not found", 404);
    return data;
  }
}
