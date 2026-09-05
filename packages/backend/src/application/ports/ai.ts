import type { Attempt } from "../../domain/attempt";
import type { Grade, Transcript } from "../../domain/assessment";
import type { ConversationFeedback } from "../../domain/conversation-feedback";
import type { PreppyPreferences } from "../../domain/preppy";
import type { WordInput } from "./vocabulary";

export interface AudioInput {
  id: string;
  questionIndex: number;
  duration: number;
  base64: string;
}

export interface TutorProvider {
  greet(
    preferences: PreppyPreferences,
  ): Promise<AsyncIterable<{ text?: string }>>;
  stream(
    messages: { role: "user" | "assistant"; content: string }[],
    context: unknown,
    preferences: PreppyPreferences,
  ): Promise<AsyncIterable<{ text?: string }>>;
}

export interface LearningAiProvider extends TutorProvider {
  transcribe(audio: AudioInput): Promise<Transcript>;
  assess(
    attempt: Attempt,
    audio: AudioInput[],
    transcripts: Transcript[],
  ): Promise<Grade>;
  speak(text: string, preferences?: PreppyPreferences): Promise<Uint8Array>;
  word(term: string, topic: string): Promise<WordInput>;
  conversationFeedback(
    messages: { role: string; content: string }[],
  ): Promise<ConversationFeedback>;
}

export interface AiProviderSource {
  readonly available: boolean;
  provider(): LearningAiProvider;
}
