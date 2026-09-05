import type {
  ArcadeStart,
  ArcadeFinish,
  ArcadeRound,
} from "../../domain/arcade-progress";

export interface ArcadeStore {
  start(userId: string, input: ArcadeStart): Promise<{ id: string }>;
  round(userId: string, id: string): Promise<ArcadeRound>;
  finish(
    userId: string,
    id: string,
    input: ArcadeFinish,
    completed: boolean,
    now: Date,
  ): Promise<boolean>;
}

export interface SpeakingArcadeResult {
  durationSeconds: number;
  speechSeconds: number;
  longestPause: number;
  completed: boolean;
}

export interface SpeakingArcadeStore {
  start(userId: string, taskId: string): Promise<{ id: string }>;
  finish(
    userId: string,
    id: string,
    result: SpeakingArcadeResult,
    now: Date,
  ): Promise<{ saved: true }>;
}
