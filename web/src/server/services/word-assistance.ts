import "server-only";
import { randomUUID } from "node:crypto";
import { config } from "../config";
import { adminClient } from "../supabase";
import { databaseError } from "../repositories/mapping";
import { GeminiProvider } from "./gemini";
import { AppError } from "@/domain/errors";

export class WordAssistance {
  constructor(private readonly db = adminClient()) {}
  async suggest(userId: string, term: string, topic: string) {
    if (!config.geminiKey)
      throw new AppError(
        "AI_UNAVAILABLE",
        "AI is not connected yet. You can add the word manually.",
        503,
      );
    databaseError(
      (
        await this.db.rpc("reserve_usage", {
          p_user: userId,
          p_kind: "chat",
          p_limit: config.dailyChatLimit,
          p_reference: randomUUID(),
        })
      ).error,
    );
    return new GeminiProvider({
      key: config.geminiKey,
      textModel: config.textModel,
      audioModel: config.audioModel,
      ttsModel: config.ttsModel,
      voice: config.voice,
    }).word(term, topic);
  }
}
