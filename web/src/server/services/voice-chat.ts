import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { adminClient } from "../supabase";
import { config } from "../config";
import { databaseError } from "../repositories/mapping";
import { AppError } from "@/domain/errors";
import type { Profile } from "@/domain/profile";
import { WavCodec } from "@/domain/wav";
import { GeminiProvider } from "./gemini";
import { TutorService } from "./tutor";
import { preppyWelcome, type PreppyPreferences } from "@/domain/preppy";

export type VoiceChatProvider = Pick<
  GeminiProvider,
  "greet" | "stream" | "transcribe" | "speak"
>;

export class VoiceChatService {
  constructor(
    private readonly db = adminClient(),
    private readonly injectedProvider?: VoiceChatProvider,
  ) {}
  private provider(): VoiceChatProvider {
    return (
      this.injectedProvider ??
      new GeminiProvider({
        key: config.geminiKey,
        textModel: config.textModel,
        audioModel: config.audioModel,
        ttsModel: config.ttsModel,
        voice: config.voice,
      })
    );
  }
  start(
    profile: Profile,
    preferences: PreppyPreferences = {
      personality: "classic",
      explicit: false,
    },
  ) {
    return new TutorService(this.db, this.provider()).respond(
      profile,
      preferences,
    );
  }
  async transcribe(userId: string, threadId: string, request: Request) {
    await this.thread(userId, threadId);
    const origin = request.headers.get("origin");
    if (
      origin &&
      origin !== new URL(request.url).origin &&
      origin !== new URL(config.appUrl).origin
    )
      throw new AppError("INVALID_ORIGIN", "Invalid request origin", 403);
    if (request.headers.get("content-type")?.split(";")[0] !== "audio/wav")
      throw new AppError("INVALID_AUDIO", "Use mono WAV audio at 16 kHz", 415);
    const maxBytes = 44 + 16000 * 2 * 60;
    if (Number(request.headers.get("content-length")) > maxBytes)
      throw new AppError(
        "BODY_TOO_LARGE",
        "A voice answer must be at most 60 seconds",
        413,
      );
    const reader = request.body?.getReader();
    if (!reader) throw new AppError("INVALID_AUDIO", "No recording received");
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > maxBytes) {
          await reader.cancel();
          throw new AppError(
            "BODY_TOO_LARGE",
            "A voice answer must be at most 60 seconds",
            413,
          );
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const buffer = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.byteLength;
    }
    let duration: number;
    try {
      const info = new WavCodec().inspect(buffer.buffer);
      if (
        info.sampleRate !== 16000 ||
        info.duration < 0.3 ||
        info.duration > 60
      )
        throw new Error("DURATION");
      duration = info.duration;
    } catch {
      throw new AppError(
        "INVALID_AUDIO",
        "Use a 0.3–60 second mono PCM WAV recording at 16 kHz",
      );
    }
    databaseError(
      (
        await this.db.rpc("reserve_usage", {
          p_user: userId,
          p_kind: "chat_transcription",
          p_limit: config.dailyChatLimit,
          p_reference: randomUUID(),
        })
      ).error,
    );
    try {
      const transcript = await this.provider().transcribe({
        id: randomUUID(),
        questionIndex: 0,
        duration,
        base64: Buffer.from(buffer).toString("base64"),
      });
      return { text: transcript.text };
    } catch {
      throw new AppError(
        "TRANSCRIPTION_FAILED",
        "Vey could not hear that answer. Retry your recording.",
        502,
      );
    }
  }
  async speak(
    userId: string,
    threadId: string,
    messageId: string,
    preferences: PreppyPreferences = {
      personality: "classic",
      explicit: false,
    },
  ) {
    await this.thread(userId, threadId);
    const { data: message, error } = await this.db
      .from("chat_messages")
      .select("content,status,role")
      .eq("id", messageId)
      .eq("thread_id", threadId)
      .eq("user_id", userId)
      .maybeSingle();
    databaseError(error);
    if (!message) throw new AppError("NOT_FOUND", "Reply not found", 404);
    if (
      message.role !== "assistant" ||
      message.status !== "complete" ||
      !message.content.trim()
    )
      throw new AppError(
        "INCOMPLETE_REPLY",
        "Only a completed Vey reply can be played",
        409,
      );
    return this.speechAsset(userId, messageId, message.content, preferences);
  }
  async welcome(userId: string) {
    return this.speechAsset(userId, "welcome", preppyWelcome, {
      personality: "classic",
      explicit: false,
    });
  }
  private async speechAsset(
    userId: string,
    messageId: string,
    content: string,
    preferences: PreppyPreferences,
  ) {
    const cacheKey = createHash("sha256")
      .update(
        `${userId}|${messageId}|${config.ttsModel}|${config.voice}|${preferences.personality}|${preferences.explicit}|${content}`,
      )
      .digest("hex");
    const path = `spark/${userId}/${cacheKey}.wav`;
    const cached = await this.db
      .from("speech_assets")
      .select("path")
      .eq("cache_key", cacheKey)
      .maybeSingle();
    databaseError(cached.error);
    if (!cached.data) {
      let audio: Uint8Array;
      try {
        audio = await this.provider().speak(content, preferences);
      } catch {
        throw new AppError(
          "TTS_FAILED",
          "Your reply is saved, but its audio is unavailable. Retry playback.",
          502,
        );
      }
      databaseError(
        (
          await this.db.storage
            .from("examiner")
            .upload(path, audio, { contentType: "audio/wav", upsert: true })
        ).error,
      );
      databaseError(
        (
          await this.db
            .from("speech_assets")
            .upsert({ cache_key: cacheKey, path, model: config.ttsModel })
        ).error,
      );
    }
    const { data, error: urlError } = await this.db.storage
      .from("examiner")
      .createSignedUrl(path, 300);
    databaseError(urlError);
    return { url: data!.signedUrl };
  }
  private async thread(userId: string, threadId: string) {
    const { data, error } = await this.db
      .from("chat_threads")
      .select("id")
      .eq("id", threadId)
      .eq("user_id", userId)
      .maybeSingle();
    databaseError(error);
    if (!data) throw new AppError("NOT_FOUND", "Conversation not found", 404);
  }
}
