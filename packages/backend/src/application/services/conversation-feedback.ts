import { ConversationMetrics } from "../../domain/conversation-feedback";
import { AppError } from "../../domain/errors";
import type { TutorService } from "./tutor";
import type { AiProviderSource } from "../ports/ai";
import type { UsageQuota } from "../ports/conversations";
import type { IdentifierSource } from "../ports/runtime";

export class ConversationFeedbackService {
  constructor(
    private readonly tutor: Pick<TutorService, "messages">,
    private readonly ai: AiProviderSource,
    private readonly quota: UsageQuota,
    private readonly ids: IdentifierSource,
    private readonly dailyLimit: number,
  ) {}

  async analyse(userId: string, threadId: string) {
    const messages = await this.tutor.messages(userId, threadId);
    if (messages.some((message) => message.status === "streaming"))
      throw new AppError(
        "STILL_SAVING",
        "Your conversation is still saving. Try again in a moment.",
        "conflict",
      );
    if (!new ConversationMetrics(messages).sufficient)
      return { status: "too_short" as const };
    await this.quota.reserve(
      userId,
      "chat_feedback",
      this.dailyLimit,
      this.ids.create(),
    );
    const feedback = await this.ai.provider().conversationFeedback(messages);
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
        "upstream",
      );
    return { status: "ready" as const, feedback };
  }
}
