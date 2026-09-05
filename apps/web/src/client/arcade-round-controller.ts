export type ArcadeGame = "challenge" | "survival" | "runner";
export interface ArcadeRoundSnapshot {
  phase: "setup" | "connecting" | "playing" | "finished" | "error";
  elapsed: number;
  speechSeconds: number;
  silence: number;
  intensity: number;
  score: number;
  answers: number;
  error: string | null;
}

export class ArcadeRoundController {
  private state: ArcadeRoundSnapshot = {
    phase: "setup",
    elapsed: 0,
    speechSeconds: 0,
    silence: 0,
    intensity: 0,
    score: 0,
    answers: 0,
    error: null,
  };
  private listeners = new Set<() => void>();
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private frame = 0;
  private generation = 0;
  private previous = 0;
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(patch: Partial<ArcadeRoundSnapshot>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  async start(game: ArcadeGame, duration: number, pauseLimit: number) {
    await this.stopResources();
    const generation = ++this.generation;
    this.update({
      phase: "connecting",
      elapsed: 0,
      speechSeconds: 0,
      silence: 0,
      intensity: 0,
      score: 0,
      answers: 0,
      error: null,
    });
    if (game === "runner") {
      this.update({ phase: "playing" });
      this.previous = performance.now();
      const tick = (now: number) => {
        const delta = Math.max(0, (now - this.previous) / 1000);
        this.previous = now;
        this.update({
          elapsed: Math.min(duration, this.state.elapsed + delta),
        });
        if (this.state.elapsed >= duration) this.finish();
        else this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
      return;
    }
    try {
      this.context = new AudioContext();
      await this.context.resume();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      if (generation !== this.generation) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      this.stream = stream;
      const analyser = this.context.createAnalyser();
      analyser.fftSize = 1024;
      this.context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      this.previous = performance.now();
      this.update({ phase: "playing" });
      const tick = (now: number) => {
        analyser.getFloatTimeDomainData(samples);
        const level = Math.sqrt(
          samples.reduce((sum, value) => sum + value * value, 0) /
            samples.length,
        );
        const delta = Math.max(0, (now - this.previous) / 1000);
        this.previous = now;
        const active = level > 0.018;
        this.update({
          elapsed: Math.min(duration, this.state.elapsed + delta),
          speechSeconds:
            this.state.speechSeconds + (active ? Math.min(delta, 0.1) : 0),
          silence: active ? 0 : this.state.silence + delta,
          intensity: Math.min(1, level * 8),
        });
        if (
          this.state.elapsed >= duration ||
          (game === "survival" &&
            this.state.elapsed > 3 &&
            this.state.silence >= pauseLimit)
        )
          this.finish();
        else this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
    } catch (caught) {
      if (generation !== this.generation) return;
      await this.stopResources();
      this.update({
        phase: "error",
        error:
          caught instanceof DOMException && caught.name === "NotAllowedError"
            ? "Allow microphone access in your browser and try again."
            : "The microphone could not connect. Check your input device and retry.",
      });
    }
  }
  answer(correct: boolean) {
    if (this.state.phase === "playing")
      this.update({
        score: Math.max(0, this.state.score + (correct ? 1 : -1)),
        answers: this.state.answers + 1,
      });
  }
  finish() {
    this.update({ phase: "finished", intensity: 0 });
    void this.stopResources();
  }
  private async stopResources() {
    cancelAnimationFrame(this.frame);
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    const context = this.context;
    this.context = null;
    if (context && context.state !== "closed") await context.close();
  }
  async destroy() {
    this.generation++;
    await this.stopResources();
  }
}
