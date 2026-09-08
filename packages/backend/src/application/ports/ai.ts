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

export interface TextAiProvider extends TutorProvider {
  word(term: string, topic: string): Promise<WordInput>;
  conversationFeedback(
    messages: { role: string; content: string }[],
  ): Promise<ConversationFeedback>;
}

export interface TextAiSource {
  readonly available: boolean;
  provider(model?: string): TextAiProvider;
}

export interface WritingAssessmentSource {
  readonly available: boolean;
  assessor(model: string): WritingAssessor;
}

export interface WritingAssessor {
  assessWriting(attempt: Attempt): Promise<Grade>;
}

export interface LearningAiProvider extends TextAiProvider {
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
  provider(model?: string): LearningAiProvider;
}
