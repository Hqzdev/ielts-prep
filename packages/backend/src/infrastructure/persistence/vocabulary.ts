import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  VocabularyStore,
  WordInput,
  QuizKey,
} from "../../application/ports/vocabulary";
import type {
  VocabularyWord,
  QuizQuestion,
  QuizAnswer,
} from "../../domain/vocabulary";
import { AppError } from "../../domain/errors";
import { camelRow, databaseError } from "./mapping";

export class SupabaseVocabularyStore implements VocabularyStore {
  constructor(private readonly db: SupabaseClient) {}
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

  async save(userId: string, wordId: string, saved: boolean) {
    const { data } = await this.db
      .from("vocabulary_words")
      .select("id")
      .eq("id", wordId)
      .or(`owner_id.is.null,owner_id.eq.${userId}`)
      .maybeSingle();
    if (!data) throw new AppError("NOT_FOUND", "Word not found", "not_found");
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

  async quiz(userId: string, id: string) {
    const { data, error } = await this.db
      .from("vocabulary_quizzes")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    databaseError(error);
    if (!data) throw new AppError("NOT_FOUND", "Quiz not found", "not_found");
    return {
      id: data.id,
      questions: data.questions,
      result: data.result,
      answerKey: data.answer_key,
    };
  }

  async add(userId: string, id: string, input: WordInput, gapSentence: string) {
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
          gap_sentence: gapSentence,
        })
      ).error,
    );
  }
  async createQuiz(userId: string, questions: QuizQuestion[], key: QuizKey[]) {
    const { data, error } = await this.db
      .from("vocabulary_quizzes")
      .insert({ user_id: userId, questions, answer_key: key })
      .select("id")
      .single();
    databaseError(error);
    return data!.id as string;
  }
  async finishQuiz(userId: string, id: string, result: QuizAnswer[]) {
    const { data, error } = await this.db.rpc("finish_vocabulary_quiz", {
      p_user: userId,
      p_id: id,
      p_result: result,
    });
    databaseError(error);
    return data as QuizAnswer[];
  }
}
