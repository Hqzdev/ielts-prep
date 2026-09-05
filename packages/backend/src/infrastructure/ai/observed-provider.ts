import type {
  AiProviderSource,
  LearningAiProvider,
  AudioInput,
} from "../../application/ports/ai";
import type { Attempt } from "../../domain/attempt";
import type { Transcript } from "../../domain/assessment";
import type { PreppyPreferences } from "../../domain/preppy";
import { measure, recordMetric } from "../telemetry/context";

export class ObservedAiSource implements AiProviderSource {
  constructor(private readonly source: AiProviderSource) {}
  get available() {
    return this.source.available;
  }
  provider() {
    return new ObservedAiProvider(this.source.provider());
  }
}

class ObservedAiProvider implements LearningAiProvider {
  constructor(private readonly inner: LearningAiProvider) {}
  transcribe(audio: AudioInput) {
    return measure("ai.transcribe", () => this.inner.transcribe(audio));
  }
  assess(attempt: Attempt, audio: AudioInput[], transcripts: Transcript[]) {
    return measure("ai.assess", () =>
      this.inner.assess(attempt, audio, transcripts),
    );
  }
  speak(text: string, preferences?: PreppyPreferences) {
    return measure("ai.speak", () => this.inner.speak(text, preferences));
  }
  word(term: string, topic: string) {
    return measure("ai.word", () => this.inner.word(term, topic));
  }
  conversationFeedback(messages: { role: string; content: string }[]) {
    return measure("ai.conversation_feedback", () =>
      this.inner.conversationFeedback(messages),
    );
  }
  async greet(preferences: PreppyPreferences) {
    return this.observe(
      "ai.greet",
      await measure("ai.greet_open", () => this.inner.greet(preferences)),
    );
  }
  async stream(
    messages: { role: "user" | "assistant"; content: string }[],
    context: unknown,
    preferences: PreppyPreferences,
  ) {
    return this.observe(
      "ai.chat",
      await measure("ai.chat_open", () =>
        this.inner.stream(messages, context, preferences),
      ),
    );
  }

  private async *observe(
    operation: string,
    source: AsyncIterable<{ text?: string }>,
  ) {
    const started = performance.now();
    let success = false;
    try {
      yield* source;
      success = true;
    } finally {
      recordMetric("operation_completed", {
        operation,
        success,
        durationMs: Math.round(performance.now() - started),
      });
    }
  }
}
