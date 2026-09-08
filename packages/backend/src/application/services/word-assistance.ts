import { AppError } from "../../domain/errors";
import type { TextAiSource } from "../ports/ai";
import type { UsageQuota } from "../ports/conversations";
import type { IdentifierSource } from "../ports/runtime";

export class WordAssistance {
  constructor(
    private readonly ai: TextAiSource,
    private readonly quota: UsageQuota,
    private readonly ids: IdentifierSource,
    private readonly dailyLimit: number,
  ) {}

  async suggest(userId: string, term: string, topic: string) {
    if (!this.ai.available)
      throw new AppError(
        "AI_UNAVAILABLE",
        "AI is not connected yet. You can add the word manually.",
        "unavailable",
      );
    await this.quota.reserve(
      userId,
      "chat",
      this.dailyLimit,
      this.ids.create(),
    );
    return this.ai.provider().word(term, topic);
  }
}
