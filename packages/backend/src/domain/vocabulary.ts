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
