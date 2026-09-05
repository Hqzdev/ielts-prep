export interface ArcadeState {
  elapsed: number;
  speechSeconds: number;
  longestPause: number;
  pauseSeconds: number;
  ballY: number;
  velocity: number;
  finished: boolean;
  completed: boolean;
}
export class ArcadeEngine {
  private state: ArcadeState = {
    elapsed: 0,
    speechSeconds: 0,
    longestPause: 0,
    pauseSeconds: 0,
    ballY: 0.38,
    velocity: 0,
    finished: false,
    completed: false,
  };
  get snapshot(): ArcadeState {
    return { ...this.state };
  }
  advance(delta: number, speaking: boolean): ArcadeState {
    let remaining = Math.min(Math.max(delta, 0), 120 - this.state.elapsed);
    while (remaining > 0 && !this.state.finished) {
      const dt = Math.min(0.05, remaining);
      remaining -= dt;
      this.state.elapsed += dt;
      if (speaking) {
        this.state.speechSeconds += dt;
        this.state.pauseSeconds = 0;
        this.state.velocity = 0;
        this.state.ballY += (0.36 - this.state.ballY) * (1 - Math.exp(-4 * dt));
      } else {
        this.state.pauseSeconds += dt;
        this.state.longestPause = Math.max(
          this.state.longestPause,
          this.state.pauseSeconds,
        );
        if (this.state.pauseSeconds > 2) {
          this.state.velocity = Math.min(0.45, this.state.velocity + 0.2 * dt);
          this.state.ballY += this.state.velocity * dt;
        }
      }
      if (this.state.ballY >= 0.86) {
        this.state.finished = true;
        this.state.completed = false;
      } else if (this.state.elapsed >= 119.999) {
        this.state.finished = true;
        this.state.completed = true;
        this.state.elapsed = 120;
      }
    }
    return this.snapshot;
  }
  stop(): ArcadeState {
    this.state.finished = true;
    return this.snapshot;
  }
}
