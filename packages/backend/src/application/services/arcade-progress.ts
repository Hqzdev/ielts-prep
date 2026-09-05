import {
  ArcadeCompletion,
  type ArcadeStart,
  type ArcadeFinish,
} from "../../domain/arcade-progress";
import type { ArcadeStore } from "../ports/arcade";
import type { Clock } from "../ports/runtime";

export class ArcadeProgressService {
  constructor(
    private readonly store: ArcadeStore,
    private readonly clock: Clock,
  ) {}

  start(userId: string, input: ArcadeStart) {
    return this.store.start(userId, input);
  }

  async finish(userId: string, id: string, input: ArcadeFinish) {
    const round = await this.store.round(userId, id);
    if (round.finishedAt) return { saved: true, completed: round.completed };
    const now = this.clock.now();
    const completed = new ArcadeCompletion().evaluate(round, input, now);
    return {
      saved: true,
      completed: await this.store.finish(userId, id, input, completed, now),
    };
  }
}
