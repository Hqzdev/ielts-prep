import type { SupabaseClient } from "@supabase/supabase-js";
import type { ArcadeStore } from "../../application/ports/arcade";
import type {
  ArcadeStart,
  ArcadeFinish,
  ArcadeRound,
} from "../../domain/arcade-progress";
import { AppError } from "../../domain/errors";
import { databaseError, camelRow } from "./mapping";

export class SupabaseArcadeStore implements ArcadeStore {
  constructor(private readonly db: SupabaseClient) {}

  async start(userId: string, input: ArcadeStart) {
    const { data, error } = await this.db
      .from("arcade_rounds")
      .insert({
        user_id: userId,
        game: input.game,
        target_seconds: input.duration,
      })
      .select("id")
      .single();
    databaseError(error);
    return data as { id: string };
  }

  async round(userId: string, id: string): Promise<ArcadeRound> {
    const { data, error } = await this.db
      .from("arcade_rounds")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    databaseError(error);
    if (!data) throw new AppError("NOT_FOUND", "Round not found", "not_found");
    return camelRow(data) as unknown as ArcadeRound;
  }

  async finish(
    userId: string,
    id: string,
    input: ArcadeFinish,
    completed: boolean,
    now: Date,
  ) {
    const { data, error } = await this.db
      .from("arcade_rounds")
      .update({
        finished_at: now.toISOString(),
        elapsed_seconds: input.elapsed,
        speech_seconds: input.speechSeconds,
        answers: input.answers,
        completed,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .is("finished_at", null)
      .select("completed")
      .maybeSingle();
    databaseError(error);
    return (data?.completed ??
      (await this.round(userId, id)).completed) as boolean;
  }
}
