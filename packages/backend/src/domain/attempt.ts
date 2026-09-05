import type { Task } from "./task";

export type Answer = {
  text: string;
  reading: Record<string, string | string[]>;
  audioIds: string[];
};

export type AttemptMode = "practice" | "strict";

export type AttemptStatus =
  "in_progress" | "paused" | "submitted" | "completed";

export type AssessmentStatus =
  | "unavailable"
  | "queued"
  | "processing"
  | "ready"
  | "failed"
  | "insufficient_evidence";

export interface Attempt {
  id: string;
  userId: string;
  taskId: string;
  taskVersion: number;
  taskSnapshot: Task;
  mode: AttemptMode;
  status: AttemptStatus;
  answer: Answer;
  revision: number;
  parentAttemptId: string | null;
  startedAt: string;
  deadlineAt: string | null;
  submittedAt: string | null;
  elapsedSeconds: number;
  activeSince: string | null;
  createdAt: string;
  updatedAt: string;
}

export class AttemptClock {
  elapsed(attempt: Attempt, now = Date.now()): number {
    if (attempt.mode === "strict") {
      const until = attempt.submittedAt ? Date.parse(attempt.submittedAt) : now;
      return Math.max(
        0,
        Math.floor((until - Date.parse(attempt.startedAt)) / 1000),
      );
    }
    const active =
      attempt.status === "in_progress" && attempt.activeSince
        ? Math.max(
            0,
            Math.floor((now - Date.parse(attempt.activeSince)) / 1000),
          )
        : 0;
    return attempt.elapsedSeconds + active;
  }

  remaining(attempt: Attempt, now = Date.now()): number {
    return attempt.mode === "strict" && attempt.deadlineAt
      ? Math.ceil((Date.parse(attempt.deadlineAt) - now) / 1000)
      : attempt.taskSnapshot.durationSeconds - this.elapsed(attempt, now);
  }

  expired(attempt: Attempt, now = Date.now()): boolean {
    return (
      attempt.mode === "strict" &&
      !!attempt.deadlineAt &&
      Date.parse(attempt.deadlineAt) <= now
    );
  }
}

export function wordCount(text: string): number {
  return (text.trim().match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) ?? [])
    .length;
}
