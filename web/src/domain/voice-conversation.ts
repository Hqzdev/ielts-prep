export type PreppyState =
  "idle" | "listening" | "thinking" | "speaking" | "success" | "error";
export type ConversationState =
  | "setup"
  | "listening"
  | "transcribing"
  | "thinking"
  | "speaking"
  | "ended"
  | "error";
export type MicrophoneMode = "hands-free" | "hold";
export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: string;
}
export function preppyStateFor(state: ConversationState): PreppyState {
  if (state === "setup") return "idle";
  if (state === "ended") return "success";
  if (state === "transcribing") return "thinking";
  return state;
}
export class ConversationTiming {
  private deadline = 0;
  private recordingAt: number | null = null;
  private lastSpeechAt = 0;
  constructor(private readonly now = () => Date.now()) {}
  start() {
    this.deadline = this.now() + 600000;
  }
  get remaining() {
    return this.deadline
      ? Math.max(0, Math.ceil((this.deadline - this.now()) / 1000))
      : 600;
  }
  get recording() {
    return this.recordingAt !== null;
  }
  begin() {
    this.recordingAt = this.now();
    this.lastSpeechAt = this.now();
  }
  speech() {
    this.lastSpeechAt = this.now();
  }
  finish() {
    this.recordingAt = null;
  }
  shouldFinish(mode: MicrophoneMode) {
    return (
      this.recordingAt !== null &&
      (this.now() - this.recordingAt >= 60000 ||
        (mode === "hands-free" && this.now() - this.lastSpeechAt >= 1500))
    );
  }
}
