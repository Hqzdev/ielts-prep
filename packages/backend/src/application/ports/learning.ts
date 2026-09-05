import type { Assessment } from "../../domain/assessment";
import type { PlannedSession } from "../../domain/planner";
import type { Task } from "../../domain/task";

export interface StudySessionRecord extends PlannedSession {
  id: string;
  status: "planned" | "started" | "completed" | "skipped";
  attemptId: string | null;
}

export interface StudySession extends StudySessionRecord {
  task: Task;
}

export interface LearningStore {
  assessments(userId: string): Promise<Assessment[]>;
  sessions(userId: string, week: string): Promise<StudySessionRecord[]>;
  createPlan(userId: string, plan: PlannedSession[]): Promise<void>;
  completeSessions(userId: string, ids: string[]): Promise<void>;
  session(userId: string, id: string): Promise<StudySessionRecord>;
  attachAttempt(
    userId: string,
    session: StudySessionRecord,
    attemptId: string,
    completed: boolean,
  ): Promise<void>;
  move(userId: string, id: string, date: string): Promise<void>;
  activityDates(userId: string): Promise<string[]>;
}
