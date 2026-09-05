import { AppError } from "../../domain/errors";
import type {
  SpeakingArcadeStore,
  SpeakingArcadeResult,
} from "../ports/arcade";
import type { CatalogStore } from "../ports/practice";
import type { Clock } from "../ports/runtime";

export class SpeakingArcadeService {
  constructor(
    private readonly store: SpeakingArcadeStore,
    private readonly catalog: CatalogStore,
    private readonly clock: Clock,
  ) {}

  async start(userId: string, taskId: string) {
    const task = await this.catalog.task(taskId);
    if (task.skill !== "speaking" || task.part !== 2)
      throw new AppError(
        "INVALID_TASK",
        "Choose a Speaking Part 2 cue card for the arcade",
      );
    return this.store.start(userId, taskId);
  }

  finish(userId: string, id: string, result: SpeakingArcadeResult) {
    return this.store.finish(userId, id, result, this.clock.now());
  }
}
