import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import { adminClient } from "../supabase";
import { camelRow, databaseError } from "../repositories/mapping";
import {
  normalizeWord,
  type VocabularyWord,
  type VocabularyQuiz,
  type QuizQuestion,
  type QuizAnswer,
  wordInputSchema,
} from "@/domain/vocabulary";
import { AppError } from "@/domain/errors";
import { z } from "zod";

export class VocabularyService {
  constructor(private readonly db = adminClient()) {}
  async words(userId: string): Promise<VocabularyWord[]> {
    const [words, saved, results] = await Promise.all([
      this.db
        .from("vocabulary_words")
        .select("*")
        .or(`owner_id.is.null,owner_id.eq.${userId}`)
        .order("id")
        .limit(3000),
      this.db.from("saved_words").select("word_id").eq("user_id", userId),
      this.db
        .from("vocabulary_results")
        .select("word_id,correct")
        .eq("user_id", userId)
        .limit(20000),
    ]);
    for (const response of [words, saved, results])
      databaseError(response.error);
    return (words.data ?? []).map((row) => ({
      ...camelRow(row),
      saved: saved.data?.some((s) => s.word_id === row.id) ?? false,
      correct:
        results.data?.filter((r) => r.word_id === row.id && r.correct).length ??
        0,
      total: results.data?.filter((r) => r.word_id === row.id).length ?? 0,
    })) as unknown as VocabularyWord[];
  }
  async add(userId: string, input: z.infer<typeof wordInputSchema>) {
    const location = input.example
      .toLowerCase()
      .indexOf(input.term.toLowerCase());
    const id = randomUUID();
    databaseError(
      (
        await this.db.from("vocabulary_words").insert({
          id,
          owner_id: userId,
          term: input.term,
          translation: input.translation,
          part_of_speech: input.partOfSpeech,
          example: input.example,
          topic: input.topic,
          gap_sentence:
            input.example.slice(0, location) +
            "______" +
            input.example.slice(location + input.term.length),
        })
      ).error,
    );
    return { id };
  }
  async save(userId: string, wordId: string, saved: boolean) {
    const { data } = await this.db
      .from("vocabulary_words")
      .select("id")
      .eq("id", wordId)
      .or(`owner_id.is.null,owner_id.eq.${userId}`)
      .maybeSingle();
    if (!data) throw new AppError("NOT_FOUND", "Word not found", 404);
    databaseError(
      saved
        ? (
            await this.db
              .from("saved_words")
              .upsert({ user_id: userId, word_id: wordId })
          ).error
        : (
            await this.db
              .from("saved_words")
              .delete()
              .eq("user_id", userId)
              .eq("word_id", wordId)
          ).error,
    );
    return { saved };
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
          randomInt(1000) / 1000,
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
    const { data, error } = await this.db
      .from("vocabulary_quizzes")
      .insert({ user_id: userId, questions, answer_key: key })
      .select("id")
      .single();
    databaseError(error);
    return { id: data!.id, questions, result: null };
  }
  async quiz(userId: string, id: string): Promise<VocabularyQuiz> {
    const row = await this.row(userId, id);
    return { id: row.id, questions: row.questions, result: row.result };
  }
  async submit(
    userId: string,
    id: string,
    answers: Record<string, string>,
  ): Promise<QuizAnswer[]> {
    const quiz = await this.row(userId, id);
    if (quiz.result) return quiz.result;
    const result: QuizAnswer[] = (
      quiz.answer_key as Omit<QuizAnswer, "correct" | "given">[]
    ).map((key) => ({
      ...key,
      given: answers[key.questionId] ?? "",
      correct:
        normalizeWord(answers[key.questionId] ?? "") ===
        normalizeWord(key.expected),
    }));
    const { data, error } = await this.db.rpc("finish_vocabulary_quiz", {
      p_user: userId,
      p_id: id,
      p_result: result,
    });
    databaseError(error);
    return data;
  }
  private async row(userId: string, id: string) {
    const { data, error } = await this.db
      .from("vocabulary_quizzes")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    databaseError(error);
    if (!data) throw new AppError("NOT_FOUND", "Quiz not found", 404);
    return data;
  }
  private shuffle<T>(items: T[]): T[] {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index--) {
      const j = randomInt(index + 1);
      [result[index], result[j]] = [result[j], result[index]];
    }
    return result;
  }
}
