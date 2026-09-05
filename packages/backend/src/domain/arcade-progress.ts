import { AppError } from "./errors";

export interface ArcadeStart {
  game: "challenge" | "survival" | "runner";
  duration: 30 | 60;
}

export interface ArcadeFinish {
  elapsed: number;
  speechSeconds: number;
  answers: number;
}

export interface ArcadeRound {
  id: string;
  game: ArcadeStart["game"];
  targetSeconds: number;
  startedAt: string;
  finishedAt: string | null;
  completed: boolean;
}

export class ArcadeCompletion {
  evaluate(round: ArcadeRound, input: ArcadeFinish, now: Date): boolean {
    const elapsed = (now.getTime() - Date.parse(round.startedAt)) / 1000;
    if (
      input.elapsed > elapsed + 2 ||
      input.elapsed > round.targetSeconds + 0.15
    ) {
      throw new AppError(
        "INVALID_DURATION",
        "The round has not run for that long",
      );
    }
    const timed = input.elapsed >= round.targetSeconds - 0.15;
    return round.game === "runner"
      ? input.answers === 8 || (timed && input.answers > 0)
      : timed && input.speechSeconds > 0;
  }
}
