import "server-only";
import { taskSchema, readingKeySchema, type Task } from "@/domain/task";
import { z } from "zod";
import { adminClient } from "../supabase";
import { databaseError } from "./mapping";
import { AppError } from "@/domain/errors";
import { ReadingBandCalculator } from "@/domain/reading-band";

export interface CatalogItem {
  task: Task;
  status: "new" | "started" | "completed";
  lastAttemptId: string | null;
  lastBand: number | null;
  lastAccuracy: number | null;
  lastActivity: string | null;
}
interface AssessmentSummary {
  status: string;
  band: number | null;
  reading: { earned: number; possible: number }[] | null;
}

export class CatalogRepository {
  constructor(
    private readonly db = adminClient(),
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
    if (!data) throw new AppError("NOT_FOUND", "Task not found", 404);
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
