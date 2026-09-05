import {
  normalizeWord,
  type VocabularyQuiz,
  type QuizQuestion,
  type QuizAnswer,
} from "../../domain/vocabulary";
import { AppError } from "../../domain/errors";
import type { VocabularyStore, WordInput } from "../ports/vocabulary";
import type { IdentifierSource, RandomSource } from "../ports/runtime";

export class VocabularyService {
  constructor(
    private readonly store: VocabularyStore,
    private readonly ids: IdentifierSource,
    private readonly random: RandomSource,
  ) {}
  words(userId: string) {
    return this.store.words(userId);
  }
  save(userId: string, wordId: string, saved: boolean) {
    return this.store.save(userId, wordId, saved);
  }
  async add(userId: string, input: WordInput) {
    const location = input.example
      .toLowerCase()
      .indexOf(input.term.toLowerCase());
    if (location < 0)
      throw new AppError(
        "INVALID_EXAMPLE",
        "The example must contain the word in its exact form",
      );
    const id = this.ids.create();
    await this.store.add(
      userId,
      id,
      input,
      input.example.slice(0, location) +
        "______" +
        input.example.slice(location + input.term.length),
    );
    return { id };
  }
  async quiz(userId: string, id: string): Promise<VocabularyQuiz> {
    const row = await this.store.quiz(userId, id);
    return { id: row.id, questions: row.questions, result: row.result };
  }
  async createQuiz(
    userId: string,
    topic?: string,
    personal = false,
  ): Promise<VocabularyQuiz> {
    let words = await this.words(userId);
    const all = words;
    if (topic) words = words.filter((w) => w.topic === topic);
    if (personal) words = words.filter((w) => w.ownerId === userId || w.saved);
    if (words.length < 10)
      throw new AppError(
        "NOT_ENOUGH_WORDS",
        "You need at least 10 words in the selected collection to start a quiz",
      );
    const selected = words
      .map((word) => ({
        word,
        priority:
          (word.total - word.correct) * 3 -
          word.correct * 0.25 +
          this.random.integer(1000) / 1000,
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10)
      .map((row) => row.word);
    const questions: QuizQuestion[] = selected.map((word, index) => ({
      id: String(index + 1),
      wordId: word.id,
      type: index % 2 ? "gap" : "translation",
      prompt: index % 2 ? word.gapSentence : word.term,
      options:
        index % 2
          ? []
          : this.shuffle([
              ...new Set([
                word.translation,
                ...this.shuffle(
                  all
                    .filter((w) => w.translation !== word.translation)
                    .map((w) => w.translation),
                ).slice(0, 3),
              ]),
            ]),
    }));
    const key = selected.map((word, index) => ({
      questionId: String(index + 1),
      wordId: word.id,
      type: questions[index].type,
      expected: questions[index].type === "gap" ? word.term : word.translation,
      term: word.term,
      translation: word.translation,
      example: word.example,
    }));
    const id = await this.store.createQuiz(userId, questions, key);
    return { id, questions, result: null };
  }

  async submit(
    userId: string,
    id: string,
    answers: Record<string, string>,
  ): Promise<QuizAnswer[]> {
    const quiz = await this.store.quiz(userId, id);
    if (quiz.result) return quiz.result;
    const result: QuizAnswer[] = (
      quiz.answerKey as Omit<QuizAnswer, "correct" | "given">[]
    ).map((key) => ({
      ...key,
      given: answers[key.questionId] ?? "",
      correct:
        normalizeWord(answers[key.questionId] ?? "") ===
        normalizeWord(key.expected),
    }));
    return this.store.finishQuiz(userId, id, result);
  }

  private shuffle<T>(items: T[]): T[] {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index--) {
      const j = this.random.integer(index + 1);
      [result[index], result[j]] = [result[j], result[index]];
    }
    return result;
  }
}
