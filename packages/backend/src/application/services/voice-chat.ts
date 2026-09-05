import { AppError } from "../../domain/errors";
import { WavCodec } from "../../domain/wav";
import type { Profile } from "../../domain/profile";
import type { PreppyPreferences } from "../../domain/preppy";
import { preppyWelcome } from "../../domain/conversation";
import type { ConversationStore, UsageQuota } from "../ports/conversations";
import type { AiProviderSource } from "../ports/ai";
import type { IdentifierSource, ContentEncoding } from "../ports/runtime";
import type { TutorService } from "./tutor";
import type { SpeechService } from "./speech";

const defaultPreferences: PreppyPreferences = {
  personality: "classic",
  explicit: false,
};

export class VoiceChatService {
  constructor(
    private readonly store: ConversationStore,
    private readonly tutor: TutorService,
    private readonly speech: SpeechService,
    private readonly ai: AiProviderSource,
    private readonly quota: UsageQuota,
    private readonly ids: IdentifierSource,
    private readonly encoding: ContentEncoding,
    private readonly dailyLimit: number,
  ) {}

  start(profile: Profile, preferences = defaultPreferences) {
    return this.tutor.respond(profile, preferences);
  }

  async transcribe(userId: string, threadId: string, bytes: Uint8Array) {
    await this.store.thread(userId, threadId);
    let duration: number;
    try {
      const info = new WavCodec().inspect(Uint8Array.from(bytes).buffer);
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
    await this.quota.reserve(
      userId,
      "chat_transcription",
      this.dailyLimit,
      this.ids.create(),
    );
    try {
      const transcript = await this.ai.provider().transcribe({
        id: this.ids.create(),
        questionIndex: 0,
        duration,
        base64: this.encoding.base64(bytes),
      });
      return { text: transcript.text };
    } catch {
      throw new AppError(
        "TRANSCRIPTION_FAILED",
        "Vey could not hear that answer. Retry your recording.",
        "upstream",
      );
    }
  }

  async speak(
    userId: string,
    threadId: string,
    messageId: string,
    preferences = defaultPreferences,
  ) {
    await this.store.thread(userId, threadId);
    const message = (await this.store.messages(userId, threadId)).find(
      (message) => message.id === messageId,
    );
    if (!message)
      throw new AppError("NOT_FOUND", "Reply not found", "not_found");
    if (
      message.role !== "assistant" ||
      message.status !== "complete" ||
      !message.content.trim()
    )
      throw new AppError(
        "INCOMPLETE_REPLY",
        "Only a completed Vey reply can be played",
        "conflict",
      );
    return this.speechAsset(userId, messageId, message.content, preferences);
  }

  welcome(userId: string) {
    return this.speechAsset(
      userId,
      "welcome",
      preppyWelcome,
      defaultPreferences,
    );
  }

  private async speechAsset(
    userId: string,
    messageId: string,
    content: string,
    preferences: PreppyPreferences,
  ) {
    try {
      return await this.speech.reply(userId, messageId, content, preferences);
    } catch (error) {
      if (error instanceof AppError && error.code === "DATABASE_ERROR")
        throw error;
      throw new AppError(
        "TTS_FAILED",
        "Your reply is saved, but its audio is unavailable. Retry playback.",
        "upstream",
      );
    }
  }
}
