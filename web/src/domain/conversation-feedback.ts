import { z } from "zod";
import type { ConversationMessage } from "./voice-conversation";

export const conversationFeedbackSchema = z.object({
  strengths: z.array(z.string().min(1).max(600)).max(4),
  improvements: z
    .array(
      z.object({
        quote: z.string().min(1).max(500),
        correction: z.string().min(1).max(500),
        explanation: z.string().min(1).max(600),
      }),
    )
    .max(5),
  words: z
    .array(
      z.object({
        term: z.string().min(1).max(100),
        meaning: z.string().min(1).max(200),
        partOfSpeech: z.string().min(1).max(40),
        example: z.string().min(5).max(500),
      }),
    )
    .max(5),
});
export type ConversationFeedback = z.infer<typeof conversationFeedbackSchema>;
export class ConversationMetrics {
  readonly answers: number;
  readonly words: number;
  readonly uniqueWords: number;
  readonly sentences: number;
  constructor(messages: Pick<ConversationMessage, "role" | "content">[]) {
    const answers = messages.filter((message) => message.role === "user");
    const text = answers.map((message) => message.content).join(" ");
    const words = text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? [];
    this.answers = answers.length;
    this.words = words.length;
    this.uniqueWords = new Set(words.map((word) => word.toLowerCase())).size;
    this.sentences = text
      .split(/[.!?]+/)
      .filter((sentence) => sentence.trim()).length;
  }
  get sufficient() {
    return this.words >= 40 && this.sentences >= 3;
  }
}
