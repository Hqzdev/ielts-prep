import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  NativeStore,
  NativeEvent,
  AttemptNotes,
  SprintStore,
  SprintRecord,
} from "../../application/ports/native";
import type {
  NativeAnswers,
  NativePreferences,
  NativeOnboarding,
} from "../../domain/native-profile";
import type { AttemptMode } from "../../domain/attempt";
import { databaseError, camelRow, mapAttempt } from "./mapping";
import {
  nativeOnboardingSchema,
  nativeAttemptNotesSchema,
} from "@veylo/contracts/schemas/native";
import { AppError } from "../../domain/errors";

export class SupabaseNativeStore implements NativeStore {
  constructor(private readonly db: SupabaseClient) {}
  async onboarding(userId: string): Promise<NativeOnboarding> {
    databaseError(
      (
        await this.db
          .from("native_profiles")
          .upsert(
            { user_id: userId },
            { onConflict: "user_id", ignoreDuplicates: true },
          )
      ).error,
    );
    const { data, error } = await this.db
      .from("native_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    databaseError(error);
    return nativeOnboardingSchema.parse(camelRow(data!));
  }
  async saveOnboarding(
    userId: string,
    revision: number,
    step: number,
    answers: NativeAnswers,
    complete: boolean,
  ) {
    const { data, error } = await this.db.rpc("save_native_onboarding", {
      p_user: userId,
      p_revision: revision,
      p_step: step,
      p_answers: answers,
      p_complete: complete,
    });
    databaseError(error);
    return nativeOnboardingSchema.parse(camelRow(data));
  }
  async preferences(userId: string, preferences: NativePreferences) {
    await this.onboarding(userId);
    databaseError(
      (
        await this.db
          .from("native_profiles")
          .update({ preferences })
          .eq("user_id", userId)
      ).error,
    );
  }
  async createAttempt(
    userId: string,
    taskId: string,
    mode: AttemptMode,
    model: string,
    parentId?: string,
  ) {
    const { data, error } = await this.db.rpc("create_native_attempt", {
      p_user: userId,
      p_task: taskId,
      p_mode: mode,
      p_model: model,
      p_parent: parentId ?? null,
    });
    databaseError(error);
    return mapAttempt(data);
  }
  async notes(userId: string, attemptId: string): Promise<AttemptNotes> {
    databaseError(
      (
        await this.db
          .from("native_attempt_notes")
          .upsert(
            { user_id: userId, attempt_id: attemptId },
            { onConflict: "attempt_id", ignoreDuplicates: true },
          )
      ).error,
    );
    const { data, error } = await this.db
      .from("native_attempt_notes")
      .select("*")
      .eq("user_id", userId)
      .eq("attempt_id", attemptId)
      .single();
    databaseError(error);
    return nativeAttemptNotesSchema.parse(camelRow(data!));
  }
  async saveNotes(userId: string, attemptId: string, notes: AttemptNotes) {
    await this.notes(userId, attemptId);
    const { data, error } = await this.db
      .from("native_attempt_notes")
      .update({
        revision: notes.revision + 1,
        flagged_questions: notes.flaggedQuestions,
        highlights: notes.highlights,
      })
      .eq("user_id", userId)
      .eq("attempt_id", attemptId)
      .eq("revision", notes.revision)
      .select()
      .maybeSingle();
    databaseError(error);
    if (!data)
      throw new AppError(
        "REVISION_CONFLICT",
        "Your notes changed on another device",
        "conflict",
      );
    return nativeAttemptNotesSchema.parse(camelRow(data));
  }
  async event(userId: string, event: NativeEvent) {
    const { error } = await this.db.from("native_events").insert({
      id: event.id,
      user_id: userId,
      event: event.event,
      step: event.step,
      entry: event.entry,
      version: event.version,
    });
    if (error?.code !== "23505") databaseError(error);
  }
  async plan(
    userId: string,
    date: string,
    candidates: string[],
  ): Promise<string[]> {
    databaseError(
      (
        await this.db
          .from("native_daily_plans")
          .upsert(
            { user_id: userId, date, task_ids: candidates },
            { onConflict: "user_id,date", ignoreDuplicates: true },
          )
      ).error,
    );
    const { data, error } = await this.db
      .from("native_daily_plans")
      .select("task_ids")
      .eq("user_id", userId)
      .eq("date", date)
      .single();
    databaseError(error);
    return data!.task_ids;
  }
}

export class SupabaseSprintStore implements SprintStore {
  constructor(private readonly db: SupabaseClient) {}
  async get(userId: string, id: string) {
    const { data, error } = await this.db
      .from("word_sprints")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();
    databaseError(error);
    return data ? (camelRow(data) as unknown as SprintRecord) : null;
  }
  async create(userId: string, id: string, quizId: string) {
    const { data, error } = await this.db.rpc("create_word_sprint", {
      p_user: userId,
      p_id: id,
      p_quiz: quizId,
    });
    databaseError(error);
    return camelRow(data) as unknown as SprintRecord;
  }
  async answer(userId: string, id: string, questionId: string, answer: string) {
    const { data, error } = await this.db.rpc("answer_word_sprint", {
      p_user: userId,
      p_id: id,
      p_question: questionId,
      p_answer: answer,
    });
    databaseError(error);
    return camelRow(data) as unknown as SprintRecord;
  }
}
