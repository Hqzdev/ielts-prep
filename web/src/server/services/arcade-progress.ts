import "server-only";
import { z } from "zod";
import { adminClient } from "../supabase";
import { databaseError } from "../repositories/mapping";
import { AppError } from "@/domain/errors";

export const arcadeStartSchema = z.object({
  game: z.enum(["challenge", "survival", "runner"]),
  duration: z.union([z.literal(30), z.literal(60)]),
});
export const arcadeFinishSchema = z
  .object({
    elapsed: z.number().min(0).max(60),
    speechSeconds: z.number().min(0).max(61),
    answers: z.number().int().min(0).max(8),
  })
  .refine((value) => value.speechSeconds <= value.elapsed + 0.15);

export class ArcadeProgressService {
  constructor(private readonly db = adminClient()) {}

  async start(userId: string, input: z.infer<typeof arcadeStartSchema>) {
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
    return data!;
  }

  async finish(
    userId: string,
    id: string,
    input: z.infer<typeof arcadeFinishSchema>,
  ) {
    const round = await this.round(userId, id);
    if (round.finished_at) return { saved: true, completed: round.completed };
    const now = new Date();
    const elapsed = (now.getTime() - Date.parse(round.started_at)) / 1000;
    if (
      input.elapsed > elapsed + 2 ||
      input.elapsed > round.target_seconds + 0.15
    )
      throw new AppError(
        "INVALID_DURATION",
        "The round has not run for that long",
      );
    const timed = input.elapsed >= round.target_seconds - 0.15;
    const completed =
      round.game === "runner"
        ? input.answers === 8 || (timed && input.answers > 0)
        : timed && input.speechSeconds > 0;
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
    return {
      saved: true,
      completed: data?.completed ?? (await this.round(userId, id)).completed,
    };
  }

  private async round(userId: string, id: string) {
    const { data, error } = await this.db
      .from("arcade_rounds")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    databaseError(error);
    if (!data) throw new AppError("NOT_FOUND", "Round not found", 404);
    return data;
  }
}
