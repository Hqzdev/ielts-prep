import { api } from "./api";
import { DraftStore, type LocalDraft } from "./draft-store";
import type { Answer, Attempt } from "@/domain/attempt";
import { AppError, errorMessage } from "@/domain/errors";

export interface DraftState {
  attempt: Attempt;
  answer: Answer;
  saveStatus: "saved" | "saving" | "changed" | "offline" | "conflict";
  error: string | null;
  recovery: LocalDraft | null;
}

export class DraftSession {
  private state: DraftState;
  private listeners = new Set<() => void>();
  private pending: Promise<void> | null = null;
  private dirty = false;
  private debounce: ReturnType<typeof setTimeout> | null = null;
  private interval: ReturnType<typeof setInterval> | null = null;
  private generation = 0;
  private readonly key: string;
  constructor(
    attempt: Attempt,
    private readonly store = new DraftStore(),
  ) {
    this.state = {
      attempt,
      answer: attempt.answer,
      saveStatus: "saved",
      error: null,
      recovery: null,
    };
    this.key = `${attempt.userId}:${attempt.id}`;
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  async start() {
    const generation = ++this.generation;
    try {
      const local = await this.store.get(this.key);
      if (
        local &&
        JSON.stringify(local.answer) !== JSON.stringify(this.state.answer) &&
        local.savedAt > Date.parse(this.state.attempt.updatedAt)
      )
        this.set({ recovery: local });
    } catch {
      this.set({
        error:
          "Local backup is unavailable in this browser. Keep an eye on the server save status.",
      });
    }
    if (generation !== this.generation) return;
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => {
      if (this.dirty && this.state.saveStatus !== "conflict")
        void this.flush().catch(() => {});
    }, 4000);
  }
  stop() {
    this.generation++;
    if (this.interval) clearInterval(this.interval);
    if (this.debounce) clearTimeout(this.debounce);
  }

  change(answer: Answer) {
    this.dirty = true;
    this.set({
      answer,
      saveStatus: this.state.saveStatus === "conflict" ? "conflict" : "changed",
    });
    void this.store
      .save(this.key, {
        answer,
        revision: this.state.attempt.revision,
        savedAt: Date.now(),
      })
      .catch(() => this.set({ error: "Could not save a local backup" }));
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => {
      if (this.state.saveStatus !== "conflict")
        void this.flush().catch(() => {});
    }, 800);
  }

  async flush(action?: "pause" | "resume"): Promise<void> {
    if (this.pending) {
      await this.pending;
      if (this.dirty || action) await this.flush(action);
      return;
    }
    if (!this.dirty && !action) return;
    if (this.state.saveStatus === "conflict")
      throw new AppError(
        "REVISION_CONFLICT",
        "Resolve the version conflict first",
        409,
      );
    const answer = this.state.answer;
    const revision = this.state.attempt.revision;
    this.set({ saveStatus: "saving", error: null });
    this.pending = api<Attempt>(`/api/attempts/${this.state.attempt.id}`, {
      method: "PATCH",
      body: JSON.stringify({ answer, revision, action }),
    })
      .then(async (attempt) => {
        this.dirty =
          JSON.stringify(this.state.answer) !== JSON.stringify(answer);
        this.set({ attempt, saveStatus: this.dirty ? "changed" : "saved" });
        if (!this.dirty) await this.store.remove(this.key).catch(() => {});
      })
      .catch((error) => {
        this.set({
          saveStatus:
            error instanceof AppError && error.code === "REVISION_CONFLICT"
              ? "conflict"
              : "offline",
          error: errorMessage(error),
        });
        throw error;
      })
      .finally(() => {
        this.pending = null;
      });
    await this.pending;
  }

  recover() {
    const answer = this.state.recovery?.answer;
    if (answer) {
      this.set({ recovery: null });
      this.change(answer);
    }
  }
  async discardRecovery() {
    this.set({ recovery: null });
    await this.store.remove(this.key);
  }
  async resolveConflict(keepLocal: boolean) {
    const local = this.state.answer;
    const result = await api<{ attempt: Attempt }>(
      `/api/attempts/${this.state.attempt.id}`,
    );
    this.dirty = false;
    this.set({
      attempt: result.attempt,
      answer: result.attempt.answer,
      saveStatus: "saved",
      error: null,
    });
    if (keepLocal) this.change(local);
    else await this.store.remove(this.key);
  }
  private set(update: Partial<DraftState>) {
    this.state = { ...this.state, ...update };
    this.listeners.forEach((listener) => listener());
  }
}
