import { z } from "zod";

export const wordFieldsSchema = z.object({
  term: z.string().trim().min(1).max(100),
  translation: z.string().trim().min(1).max(200),
  partOfSpeech: z.string().trim().min(1).max(40),
  example: z.string().trim().min(5).max(700),
  topic: z.string().trim().min(1).max(60),
});
export const wordInputSchema = wordFieldsSchema.refine(
  (word) => word.example.toLowerCase().includes(word.term.toLowerCase()),
  "The example must contain the word in its exact form",
);
export interface VocabularyWord {
  id: string;
  ownerId: string | null;
  topic: string;
  term: string;
  translation: string;
  partOfSpeech: string;
  example: string;
  gapSentence: string;
  alternatives: string[];
  saved: boolean;
  correct: number;
  total: number;
}
export interface QuizQuestion {
  id: string;
  wordId: string;
  type: "translation" | "gap";
  prompt: string;
  options: string[];
}
export interface QuizAnswer {
  questionId: string;
  wordId: string;
  type: "translation" | "gap";
  given: string;
  expected: string;
  correct: boolean;
  term: string;
  translation: string;
  example: string;
}
export interface VocabularyQuiz {
  id: string;
  questions: QuizQuestion[];
  result: QuizAnswer[] | null;
}
export function normalizeWord(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .toLowerCase();
}
