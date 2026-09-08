import type { Profile } from "../../domain/profile";
import { AppError } from "../../domain/errors";
import type { PreppyPreferences } from "../../domain/preppy";
import { PreppyReplyDecoder } from "../../domain/preppy-reply";
import type {
  ConversationStore,
  ConversationInput,
  ChatMessage,
  ChatReply,
  ChatEvent,
  UsageQuota,
} from "../ports/conversations";
import type { TextAiSource } from "../ports/ai";
import type { IdentifierSource } from "../ports/runtime";
import type { PracticeStore } from "../ports/practice";
import type { LearningService } from "./learning";

export type { ChatMessage } from "../ports/conversations";

export class TutorService {
  constructor(
    private readonly store: ConversationStore,
    private readonly attempts: PracticeStore,
    private readonly learning: Pick<LearningService, "statistics">,
    private readonly ai: TextAiSource,
    private readonly quota: UsageQuota,
    private readonly ids: IdentifierSource,
    private readonly dailyLimit: number,
  ) {}

  threads(userId: string) {
    return this.store.threads(userId);
  }

  async messages(userId: string, threadId: string) {
    await this.store.thread(userId, threadId);
    return this.store.messages(userId, threadId);
  }

  async respond(
    profile: Profile,
    input: ConversationInput,
  ): Promise<ChatReply> {
    const preferences: PreppyPreferences = {
      personality: input.personality ?? "classic",
      explicit: input.explicit ?? false,
    };
    if (!this.ai.available)
      throw new AppError(
        "AI_UNAVAILABLE",
        "Your AI tutor is not connected yet. Other exercises are available.",
        "unavailable",
      );
    let attemptId = input.attemptId;
    if (input.threadId)
      attemptId =
        (await this.store.thread(profile.id, input.threadId)).attemptId ??
        undefined;
    const attempt = attemptId
      ? await this.attempts.get(profile.id, attemptId)
      : null;
    const assessment = attempt
      ? await this.attempts.assessment(profile.id, attempt.id)
      : null;
    const statistics = await this.learning.statistics(profile.id);
    const title =
      input.content?.slice(0, 75) ??
      `Vey AI · ${preferences.personality[0].toUpperCase()}${preferences.personality.slice(1)}`;
    const threadId =
      input.threadId ??
      (await this.store.createThread(profile.id, title, attemptId));
    const previous = await this.messages(profile.id, threadId);
    const userMessageId = this.ids.create();
    const assistantId = input.retryAssistantId ?? this.ids.create();
    const retry = input.retryAssistantId
      ? previous.find(
          (message) =>
            message.id === input.retryAssistantId &&
            message.role === "assistant",
        )
      : undefined;
    if (input.retryAssistantId && (!retry || retry.status !== "failed"))
      throw new AppError(
        "INVALID_RETRY",
        "Only an interrupted Vey reply can be retried",
        "conflict",
      );
    await this.quota.reserve(
      profile.id,
      "chat",
      this.dailyLimit,
      this.ids.create(),
    );
    if (!retry)
      await this.store.createMessages(
        profile.id,
        threadId,
        userMessageId,
        assistantId,
        input.content,
      );
    else if (!(await this.store.claimRetry(profile.id, assistantId)))
      throw new AppError(
        "RETRY_IN_PROGRESS",
        "This reply is already being retried",
        "conflict",
      );
    const context = {
      goal: profile.targetBand,
      schedule: { minutes: profile.dailyMinutes, days: profile.studyDays },
      weaknesses: statistics.skills.map((skill) => ({
        skill: skill.skill,
        count: skill.count,
        criteria: skill.criteria,
        errors: skill.errors,
      })),
      selectedAttempt: attempt
        ? {
            task: attempt.taskSnapshot,
            answer: attempt.answer.text,
            assessment,
          }
        : null,
    };
    return {
      events: this.generate(
        profile.id,
        threadId,
        assistantId,
        previous,
        preferences,
        context,
        input.content,
        retry,
      ),
    };
  }

  private async *generate(
    userId: string,
    threadId: string,
    assistantId: string,
    previous: ChatMessage[],
    preferences: PreppyPreferences,
    context: unknown,
    userContent?: string,
    retry?: ChatMessage,
  ): AsyncGenerator<ChatEvent> {
    yield { type: "thread", threadId, assistantId };
    const expressions: ChatEvent[] = [];
    const decoder = new PreppyReplyDecoder((expression, position) =>
      expressions.push({ type: "expression", expression, position }),
    );
    let content = "";
    let status = "complete";
    try {
      const history = previous.filter(
        (message) => message.status === "complete",
      );
      const provider = this.ai.provider(retry?.model ?? undefined);
      const response =
        !userContent && !history.some((message) => message.role === "user")
          ? await provider.greet(preferences)
          : await provider.stream(
              [
                ...history
                  .slice(-20)
                  .map(({ role, content }) => ({ role, content })),
                ...(userContent
                  ? [{ role: "user" as const, content: userContent }]
                  : []),
              ],
              context,
              preferences,
            );
      for await (const chunk of response) {
        const text = decoder.push(chunk.text ?? "");
        content += text;
        yield* expressions.splice(0);
        if (text) yield { type: "token", text };
      }
      const finalText = decoder.finish();
      content += finalText;
      yield* expressions.splice(0);
      if (finalText) yield { type: "token", text: finalText };
      if (!content.trim()) throw new Error("EMPTY_RESPONSE");
    } catch {
      status = "failed";
      yield {
        type: "error",
        message:
          "The response was interrupted. Try sending your message again.",
      };
    }
    if (status === "failed" && retry && content.length < retry.content.length)
      content = retry.content;
    try {
      await this.store.saveReply(userId, assistantId, content, status);
    } catch {
      status = "failed";
      yield {
        type: "error",
        message: "Could not save the response to your history",
      };
    }
    yield { type: "done", status };
  }
}
