import type {
  NativeAnswers,
  NativeOnboarding,
  NativePreferences,
} from "../../domain/native-profile";
import type { Attempt, AttemptMode } from "../../domain/attempt";

export interface AttemptNotes {
  revision: number;
  flaggedQuestions: number[];
  highlights: string[];
}
export interface NativeEvent {
  id: string;
  event: string;
  step: number;
  entry: string;
  version: number;
}
export interface NativeStore {
  onboarding(userId: string): Promise<NativeOnboarding>;
  saveOnboarding(
    userId: string,
    revision: number,
    step: number,
    answers: NativeAnswers,
    complete: boolean,
  ): Promise<NativeOnboarding>;
  preferences(userId: string, preferences: NativePreferences): Promise<void>;
  createAttempt(
    userId: string,
    taskId: string,
    mode: AttemptMode,
    model: string,
    parentId?: string,
  ): Promise<Attempt>;
  notes(userId: string, attemptId: string): Promise<AttemptNotes>;
  saveNotes(
    userId: string,
    attemptId: string,
    notes: AttemptNotes,
  ): Promise<AttemptNotes>;
  event(userId: string, event: NativeEvent): Promise<void>;
  plan(userId: string, date: string, candidates: string[]): Promise<string[]>;
}

export interface SprintRecord {
  id: string;
  quizId: string;
  answers: Record<string, string>;
  finishedAt: string | null;
}
export interface SprintStore {
  get(userId: string, id: string): Promise<SprintRecord | null>;
  create(userId: string, id: string, quizId: string): Promise<SprintRecord>;
  answer(
    userId: string,
    id: string,
    questionId: string,
    answer: string,
  ): Promise<SprintRecord>;
}
