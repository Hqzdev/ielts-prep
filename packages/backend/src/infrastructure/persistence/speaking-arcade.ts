import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SpeakingArcadeStore,
  SpeakingArcadeResult,
} from "../../application/ports/arcade";
import { AppError } from "../../domain/errors";
import { databaseError } from "./mapping";

export class SupabaseSpeakingArcadeStore implements SpeakingArcadeStore {
  constructor(private readonly db: SupabaseClient) {}

  async start(userId: string, taskId: string) {
    const { data, error } = await this.db
      .from("arcade_sessions")
      .insert({ user_id: userId, task_id: taskId })
      .select("id")
      .single();
    databaseError(error);
    return data as { id: string };
  }

  async finish(
    userId: string,
    id: string,
    result: SpeakingArcadeResult,
    now: Date,
  ) {
    const { data, error } = await this.db
      .from("arcade_sessions")
      .select("id,finished_at")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    databaseError(error);
    if (!data) throw new AppError("NOT_FOUND", "Round not found", "not_found");
    if (!data.finished_at)
      databaseError(
        (
          await this.db
            .from("arcade_sessions")
            .update({
              duration_seconds: result.durationSeconds,
              speech_seconds: result.speechSeconds,
              longest_pause: result.longestPause,
              completed: result.completed,
              finished_at: now.toISOString(),
            })
            .eq("id", id)
            .eq("user_id", userId)
            .is("finished_at", null)
        ).error,
      );
    return { saved: true as const };
  }
}
