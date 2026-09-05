import "server-only";
import { randomUUID } from "node:crypto";
import {
  ConversationMetrics,
  conversationFeedbackSchema,
} from "@/domain/conversation-feedback";
import { AppError } from "@/domain/errors";
import { adminClient } from "../supabase";
import { config } from "../config";
import { databaseError } from "../repositories/mapping";
import { TutorService } from "./tutor";
import { GeminiProvider } from "./gemini";

export class ConversationFeedbackService {
  constructor(
    private readonly db = adminClient(),
    private readonly injectedProvider?: Pick<
      GeminiProvider,
      "conversationFeedback"
    >,
  ) {}
  async analyse(userId: string, threadId: string) {
    const messages = await new TutorService(this.db).messages(userId, threadId);
    if (messages.some((message) => message.status === "streaming"))
      throw new AppError(
        "STILL_SAVING",
        "Your conversation is still saving. Try again in a moment.",
        409,
      );
    if (!new ConversationMetrics(messages).sufficient)
      return { status: "too_short" as const };
    databaseError(
      (
        await this.db.rpc("reserve_usage", {
          p_user: userId,
          p_kind: "chat_feedback",
          p_limit: config.dailyChatLimit,
          p_reference: randomUUID(),
        })
      ).error,
    );
    const provider =
      this.injectedProvider ??
      new GeminiProvider({
        key: config.geminiKey,
        textModel: config.textModel,
        audioModel: config.audioModel,
        ttsModel: config.ttsModel,
        voice: config.voice,
      });
    const feedback = conversationFeedbackSchema.parse(
      await provider.conversationFeedback(messages),
    );
    const learnerText = messages
      .filter((message) => message.role === "user")
      .map((message) => message.content);
    if (
      feedback.improvements.some(
        (item) => !learnerText.some((answer) => answer.includes(item.quote)),
      )
    )
      throw new AppError(
        "INVALID_FEEDBACK",
        "We could not verify the feedback. Your conversation is saved; please retry.",
        502,
      );
    return { status: "ready" as const, feedback };
  }
}
