import type { Answer, Attempt, AttemptMode } from "../../domain/attempt";
import type { Assessment, ReadingVerdict } from "../../domain/assessment";
import type { ReadingKey, Task } from "../../domain/task";

export interface PracticeStore {
  get(userId: string, id: string): Promise<Attempt>;
  assessment(userId: string, attemptId: string): Promise<Assessment | null>;
  create(
    userId: string,
    taskId: string,
    mode: AttemptMode,
    parentId?: string,
  ): Promise<Attempt>;
  save(
    userId: string,
    id: string,
    revision: number,
    answer: Answer,
    action?: "pause" | "resume",
  ): Promise<Attempt>;
  submit(
    userId: string,
    id: string,
    available: boolean,
    limit: number,
  ): Promise<Assessment>;
  finishReading(
    assessment: Assessment,
    verdicts: ReadingVerdict[],
  ): Promise<Assessment>;
  retry(userId: string, id: string, limit: number): Promise<Assessment>;
  history(userId: string): Promise<Attempt[]>;
}

export interface CatalogItem {
  task: Task;
  status: "new" | "started" | "completed";
  lastAttemptId: string | null;
  lastBand: number | null;
  lastAccuracy: number | null;
  lastActivity: string | null;
}

export interface CatalogStore {
  tasks(): Promise<Task[]>;
  task(id: string): Promise<Task>;
  key(taskId: string, version: number): Promise<ReadingKey[]>;
  catalog(userId: string): Promise<CatalogItem[]>;
}

export interface RecordingAvailability {
  ready(
    userId: string,
    attemptId: string,
    ids: string[],
    now: Date,
  ): Promise<{ id: string; questionIndex: number }[]>;
}
