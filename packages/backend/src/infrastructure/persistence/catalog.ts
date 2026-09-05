import { taskSchema, readingKeySchema } from "@veylo/contracts/schemas/task";
import { type Task } from "@veylo/backend/domain/task";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { databaseError } from "./mapping";
import { AppError } from "@veylo/backend/domain/errors";
import { ReadingBandCalculator } from "@veylo/backend/domain/reading-band";

import type {
  CatalogItem,
  CatalogStore,
} from "../../application/ports/practice";
export type { CatalogItem } from "../../application/ports/practice";
interface AssessmentSummary {
  status: string;
  band: number | null;
  reading: { earned: number; possible: number }[] | null;
}

export class CatalogRepository implements CatalogStore {
  constructor(
    private readonly db: SupabaseClient,
    private readonly readingBand = new ReadingBandCalculator(),
  ) {}

  async tasks(): Promise<Task[]> {
    const { data, error } = await this.db
      .from("tasks")
      .select("id,current_version,task_versions(version,content)")
      .eq("published", true)
      .order("id");
    databaseError(error);
    return (data ?? []).map((row) =>
      taskSchema.parse(
        row.task_versions.find(
          (version) => version.version === row.current_version,
        )?.content,
      ),
    );
  }

  async task(id: string): Promise<Task> {
    const { data, error } = await this.db
      .from("tasks")
      .select("current_version,task_versions(version,content)")
      .eq("id", id)
      .eq("published", true)
      .maybeSingle();
    databaseError(error);
    if (!data) throw new AppError("NOT_FOUND", "Task not found", "not_found");
    return taskSchema.parse(
      data.task_versions.find(
        (version) => version.version === data.current_version,
      )?.content,
    );
  }

  async key(taskId: string, version: number) {
    const { data, error } = await this.db
      .from("reading_keys")
      .select("answers")
      .eq("task_id", taskId)
      .eq("version", version)
      .single();
    databaseError(error);
    return z.array(readingKeySchema).parse(data?.answers);
  }

  async catalog(userId: string): Promise<CatalogItem[]> {
    const [tasks, history] = await Promise.all([
      this.tasks(),
      this.db
        .from("attempts")
        .select("id,task_id,status,updated_at,assessments(status,band,reading)")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(5000),
    ]);
    databaseError(history.error);
    return tasks.map((task) => {
      const latest = history.data?.find((row) => row.task_id === task.id);
      const joined = latest?.assessments as unknown as
        AssessmentSummary | AssessmentSummary[] | undefined;
      const assessment = Array.isArray(joined)
        ? joined.find((row) => row.status === "ready")
        : joined?.status === "ready"
          ? joined
          : undefined;
      const reading = assessment?.reading as
        { earned: number; possible: number }[] | null;
      return {
        task,
        status: !latest
          ? "new"
          : ["in_progress", "paused"].includes(latest.status)
            ? "started"
            : "completed",
        lastAttemptId: latest?.id ?? null,
        lastBand: assessment?.band ?? this.readingBand.calculate(reading ?? []),
        lastAccuracy: reading?.length
          ? Math.round(
              (reading.reduce((n, r) => n + r.earned, 0) /
                reading.reduce((n, r) => n + r.possible, 0)) *
                1000,
            ) / 10
          : null,
        lastActivity: latest?.updated_at ?? null,
      };
    });
  }
}
