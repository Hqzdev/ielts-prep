import type {
  VocabularyWord,
  VocabularyQuiz,
  QuizAnswer,
  QuizQuestion,
} from "../../domain/vocabulary";

export interface WordInput {
  term: string;
  translation: string;
  partOfSpeech: string;
  example: string;
  topic: string;
}

export type QuizKey = Omit<QuizAnswer, "correct" | "given">;

export interface VocabularyStore {
  words(userId: string): Promise<VocabularyWord[]>;
  add(
    userId: string,
    id: string,
    input: WordInput,
    gapSentence: string,
  ): Promise<void>;
  save(
    userId: string,
    wordId: string,
    saved: boolean,
  ): Promise<{ saved: boolean }>;
  createQuiz(
    userId: string,
    questions: QuizQuestion[],
    key: QuizKey[],
  ): Promise<string>;
  quiz(
    userId: string,
    id: string,
  ): Promise<VocabularyQuiz & { answerKey: QuizKey[] }>;
  finishQuiz(
    userId: string,
    id: string,
    result: QuizAnswer[],
  ): Promise<QuizAnswer[]>;
}
