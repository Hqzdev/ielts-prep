import { z } from "zod";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { adminClient } from "@/server/supabase";
import { databaseError } from "@/server/repositories/mapping";
import { CatalogRepository } from "@/server/repositories/catalog";
import { AppError } from "@/domain/errors";
type Context = { params: Promise<{ action?: string[] }> };
export async function POST(request: Request, { params }: Context) {
  return handle(async () => {
    const profile = await requireProfile();
    const { action } = await params;
    const db = adminClient();
    if (!action?.length) {
      const { taskId } = await readBody(
        request,
        z.object({ taskId: z.string() }),
      );
      const task = await new CatalogRepository().task(taskId);
      if (task.skill !== "speaking" || task.part !== 2)
        throw new AppError(
          "INVALID_TASK",
          "Choose a Speaking Part 2 cue card for the arcade",
        );
      const { data, error } = await db
        .from("arcade_sessions")
        .insert({ user_id: profile.id, task_id: taskId })
        .select("id")
        .single();
      databaseError(error);
      return data;
    }
    const id = z.uuid().parse(action[0]);
    const { data: session, error } = await db
      .from("arcade_sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", profile.id)
      .maybeSingle();
    databaseError(error);
    if (!session) throw new AppError("NOT_FOUND", "Round not found", 404);
    if (action[1] === "finish") {
      const body = await readBody(
        request,
        z
          .object({
            durationSeconds: z.number().min(0).max(120),
            speechSeconds: z.number().min(0).max(120),
            longestPause: z.number().min(0).max(120),
            completed: z.boolean(),
          })
          .refine(
            (b) =>
              b.speechSeconds <= b.durationSeconds + 0.05 &&
              b.longestPause <= b.durationSeconds + 0.05 &&
              (!b.completed || b.durationSeconds >= 119.9),
          ),
      );
      if (session.finished_at) return session;
      databaseError(
        (
          await db
            .from("arcade_sessions")
            .update({
              duration_seconds: body.durationSeconds,
              speech_seconds: body.speechSeconds,
              longest_pause: body.longestPause,
              completed: body.completed,
              finished_at: new Date().toISOString(),
            })
            .eq("id", id)
            .is("finished_at", null)
        ).error,
      );
      return { saved: true };
    }
    throw new AppError("NOT_FOUND", "Action not found", 404);
  });
}
