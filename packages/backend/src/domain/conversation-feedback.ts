import type { ConversationMessage } from "./voice-conversation";

export type ConversationFeedback = {
  strengths: string[];
  improvements: { quote: string; correction: string; explanation: string }[];
  words: {
    term: string;
    meaning: string;
    partOfSpeech: string;
    example: string;
  }[];
};

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
