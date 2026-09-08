import { AppError } from "../../domain/errors";
import { normalizeWord } from "../../domain/vocabulary";
import type { SprintRecord, SprintStore } from "../ports/native";
import type { VocabularyStore } from "../ports/vocabulary";
import type { VocabularyService } from "./vocabulary";

export class NativeSprintService {
  constructor(
    private readonly store: SprintStore,
    private readonly words: VocabularyStore,
    private readonly vocabulary: VocabularyService,
  ) {}
  async start(userId: string, id: string) {
    const existing = await this.store.get(userId, id);
    if (existing) return this.present(userId, existing);
    const quiz = await this.vocabulary.createQuiz(userId);
    return this.present(userId, await this.store.create(userId, id, quiz.id));
  }
  async get(userId: string, id: string) {
    const record = await this.store.get(userId, id);
    if (!record)
      throw new AppError("NOT_FOUND", "Sprint not found", "not_found");
    return this.present(userId, record);
  }
  async answer(userId: string, id: string, questionId: string, answer: string) {
    return this.present(
      userId,
      await this.store.answer(userId, id, questionId, normalizeWord(answer)),
    );
  }
  private async present(userId: string, record: SprintRecord) {
    const quiz = await this.words.quiz(userId, record.quizId);
    const answers = quiz.answerKey
      .filter((key) => key.questionId in record.answers)
      .map((key) => ({
        ...key,
        given: record.answers[key.questionId],
        correct:
          normalizeWord(record.answers[key.questionId]) ===
          normalizeWord(key.expected),
      }));
    if (record.finishedAt)
      await this.words.finishQuiz(userId, record.quizId, answers);
    const score = answers.filter((answer) => answer.correct).length;
    return {
      id: record.id,
      score,
      lives: Math.max(0, 3 - answers.length + score),
      index: answers.length,
      total: quiz.questions.length,
      finished: record.finishedAt !== null,
      question: record.finishedAt
        ? null
        : (quiz.questions[answers.length] ?? null),
      lastAnswer: answers.at(-1) ?? null,
    };
  }
}
