import type { components } from "@veylo/api-client/types";
import { api, apiData } from "./api";
import { personalityFor } from "@veylo/ui-web/domain/preppy";
import {
  type PreppyPreferences,
  type PreppyExpression,
  type PreppyPosition,
} from "@veylo/backend/domain/preppy";
import { isVeyExpression } from "@veylo/backend/domain/vey-expressions";
import {
  BrowserConversationAudio,
  type ConversationAudio,
} from "./conversation-audio";
import {
  ConversationTiming,
  type ConversationMessage,
  type ConversationState,
  type MicrophoneMode,
} from "@veylo/backend/domain/voice-conversation";

export interface ConversationSnapshot {
  state: ConversationState;
  mode: MicrophoneMode;
  remaining: number;
  recording: boolean;
  intensity: number;
  roundness: number;
  preferences: PreppyPreferences;
  expression: PreppyExpression;
  position: PreppyPosition;
  messages: ConversationMessage[];
  threadId?: string;
  error: string;
}

export class VoiceConversationController {
  private snapshot: ConversationSnapshot = {
    state: "setup",
    mode: "hands-free",
    remaining: 600,
    recording: false,
    intensity: 0,
    roundness: 0,
    preferences: { personality: "classic", explicit: false },
    expression: "neutral",
    position: "default",
    messages: [],
    error: "",
  };
  private listeners = new Set<() => void>();
  private abort = new AbortController();
  private interval: ReturnType<typeof setInterval> | undefined;
  private ready = false;
  private closed = false;
  private ending = false;
  private held = false;
  private pendingAudio: Blob | null = null;
  private pendingText = "";
  private assistantId = "";
  private retryOperation: (() => Promise<void>) | null = null;
  constructor(
    private readonly audio: ConversationAudio = new BrowserConversationAudio(),
    private readonly timing = new ConversationTiming(),
  ) {}
  activate() {
    this.closed = false;
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(patch: Partial<ConversationSnapshot>) {
    if (this.closed) return;
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  async start(preferences = this.snapshot.preferences) {
    if (this.ready || this.snapshot.state === "thinking") return;
    this.closed = false;
    this.abort = new AbortController();
    this.update({
      state: "thinking",
      error: "",
      preferences,
      expression: personalityFor(preferences.personality).expression,
      position: "default",
    });
    this.retryOperation = () => this.start();
    try {
      await this.audio.prepare(
        (active) => this.speech(active),
        (intensity, roundness = 0) => this.update({ intensity, roundness }),
      );
      if (this.closed) return;
      this.ready = true;
      this.audio.mute(true);
      this.timing.start();
      this.interval = setInterval(() => this.tick(), 100);
      await this.run(() => this.streamReply("/chat/session", {}));
    } catch (error) {
      await this.audio.destroy();
      this.ready = false;
      this.fail(
        error,
        "Allow microphone access in your browser settings, then retry.",
      );
    }
  }
  setMode(mode: MicrophoneMode) {
    if (this.snapshot.recording) void this.finishRecording();
    this.held = false;
    this.update({ mode });
  }
  press() {
    if (
      this.held ||
      this.snapshot.mode !== "hold" ||
      this.snapshot.state !== "listening" ||
      this.ending
    )
      return;
    this.held = true;
    this.beginRecording();
  }
  release() {
    this.held = false;
    if (this.snapshot.mode === "hold" && this.snapshot.recording)
      void this.finishRecording();
  }
  keyDown(
    event: Pick<KeyboardEvent, "code" | "repeat" | "target" | "preventDefault">,
  ) {
    if (
      event.code !== "Space" ||
      this.snapshot.mode !== "hold" ||
      this.snapshot.state !== "listening"
    )
      return;
    const target = event.target as HTMLElement | null;
    if (
      target?.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(
        target?.tagName ?? "",
      )
    )
      return;
    event.preventDefault();
    if (!event.repeat) this.press();
  }
  keyUp(event: Pick<KeyboardEvent, "code" | "preventDefault">) {
    if (event.code === "Space" && this.held) {
      event.preventDefault();
      this.release();
    }
  }
  speech(active: boolean) {
    if (
      this.snapshot.state !== "listening" ||
      (this.ending && !this.snapshot.recording)
    )
      return;
    if (active) {
      if (!this.snapshot.recording && this.snapshot.mode === "hands-free")
        this.beginRecording();
      this.timing.speech();
    }
  }
  private beginRecording() {
    if (this.snapshot.recording || this.ending) return;
    this.audio.record();
    this.timing.begin();
    this.update({ recording: true });
  }
  tick() {
    this.update({ remaining: this.timing.remaining });
    if (this.timing.shouldFinish(this.snapshot.mode))
      void this.finishRecording();
    if (this.timing.remaining === 0 && !this.ending) {
      this.ending = true;
      if (!this.snapshot.recording) {
        this.audio.mute(true);
        if (
          this.snapshot.state === "listening" ||
          this.snapshot.state === "error"
        )
          void this.finishSession();
      }
    }
  }
  private async finishRecording() {
    if (!this.snapshot.recording) return;
    this.timing.finish();
    this.held = false;
    this.update({ recording: false, state: "transcribing" });
    this.audio.mute(true);
    await this.run(async () => {
      this.pendingAudio = await this.audio.stopRecording();
      await this.transcribe();
    });
  }
  private async transcribe() {
    if (!this.pendingAudio || !this.snapshot.threadId)
      throw new Error("Start a conversation and record an answer first.");
    if (this.pendingAudio && this.pendingAudio.size < 9644) {
      this.pendingAudio = null;
      this.retryOperation = () => this.listen();
      throw new Error(
        "That was too short. Retry, then hold the microphone a little longer while you speak.",
      );
    }
    this.retryOperation = () => this.transcribe();
    this.update({ state: "transcribing", error: "" });
    const result = await apiData(
      api.POST("/chat/audio/transcribe", {
        params: { query: { thread: this.snapshot.threadId! } },
        headers: { "Content-Type": "audio/wav" },
        body: this.pendingAudio,
        signal: this.abort.signal,
      }),
    );
    this.pendingAudio = null;
    if (!result.text.trim()) {
      await this.listen();
      return;
    }
    this.pendingText = result.text;
    this.update({
      messages: [
        ...this.snapshot.messages,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: result.text,
          status: "pending",
        },
      ],
    });
    await this.sendText();
  }
  private async sendText() {
    this.retryOperation = () => this.sendText();
    await this.streamReply("/chat/messages", {
      threadId: this.snapshot.threadId,
      content: this.pendingText,
    });
  }
  private async streamReply(
    path: "/chat/session" | "/chat/messages",
    body: components["schemas"]["ReplyToConversationRequest"],
  ) {
    this.update({ state: "thinking", error: "" });
    if (!this.snapshot.threadId)
      this.retryOperation = () => this.streamReply(path, body);
    const response = await api.POST(path, {
      body: { ...body, ...this.snapshot.preferences },
      parseAs: "stream",
      signal: this.abort.signal,
    });
    const reader = response.data?.getReader();
    if (!reader)
      throw new Error(
        "The connection was interrupted. Retry to recover your reply.",
      );
    const decoder = new TextDecoder();
    let pending = "";
    let complete = false;
    let failure = "";
    const accept = (line: string) => {
      if (!line.trim()) return;
      const event = JSON.parse(line);
      if (
        event.type === "expression" &&
        typeof event.expression === "string" &&
        isVeyExpression(event.expression)
      ) {
        this.update({
          expression: event.expression as PreppyExpression,
          position: [
            "default",
            "center",
            "mid-left",
            "mid-right",
            "top-mid",
          ].includes(event.position)
            ? event.position
            : "default",
        });
      }
      if (event.type === "thread") {
        notifyLearningActivity();
        this.assistantId = event.assistantId;
        this.pendingText = "";
        this.retryOperation = () => this.recoverReply();
        this.update({
          threadId: event.threadId,
          messages: [
            ...this.snapshot.messages
              .filter((message) => message.id !== event.assistantId)
              .map((message) =>
                message.status === "pending"
                  ? { ...message, status: "complete" }
                  : message,
              ),
            {
              id: event.assistantId,
              role: "assistant",
              content: "",
              status: "streaming",
            },
          ],
        });
      }
      if (event.type === "token")
        this.update({
          messages: this.snapshot.messages.map((message) =>
            message.id === this.assistantId
              ? { ...message, content: message.content + event.text }
              : message,
          ),
        });
      if (event.type === "error") failure = event.message;
      if (event.type === "done")
        complete = !failure && event.status !== "failed";
    };
    try {
      while (true) {
        const { value, done } = await reader.read();
        pending += decoder.decode(value, { stream: !done });
        const lines = pending.split("\n");
        pending = lines.pop() ?? "";
        lines.forEach(accept);
        if (done) break;
      }
      if (pending) accept(pending);
    } finally {
      reader.releaseLock();
    }
    if (!complete)
      throw new Error(
        failure || "The reply was interrupted. Retry to recover it.",
      );
    this.update({
      messages: this.snapshot.messages.map((message) =>
        message.id === this.assistantId
          ? { ...message, status: "complete" }
          : message,
      ),
    });
    await this.speakReply();
  }
  private async recoverReply() {
    const messages = await apiData(
      api.GET("/chat/threads/{id}/messages", {
        params: { path: { id: this.snapshot.threadId! } },
        signal: this.abort.signal,
      }),
    );
    const reply = messages.find((message) => message.id === this.assistantId);
    this.update({ messages });
    if (reply?.status === "complete") {
      await this.speakReply();
      return;
    }
    if (reply?.status === "streaming")
      throw new Error("Vey is still saving the reply. Retry in a moment.");
    await this.streamReply("/chat/messages", {
      threadId: this.snapshot.threadId,
      retryAssistantId: this.assistantId,
    });
  }
  private async speakReply() {
    if (this.ending) {
      await this.finishSession();
      return;
    }
    this.retryOperation = () => this.speakReply();
    this.update({ state: "speaking", error: "" });
    this.audio.mute(true);
    const { url } = await apiData(
      api.POST("/chat/audio/speak", {
        body: {
          threadId: this.snapshot.threadId!,
          messageId: this.assistantId,
          ...this.snapshot.preferences,
        },
        signal: this.abort.signal,
      }),
    );
    await this.audio.play(url, this.abort.signal);
    await this.listen();
  }
  private async listen() {
    if (this.ending) {
      await this.finishSession();
      return;
    }
    this.retryOperation = null;
    this.audio.mute(false);
    this.update({ state: "listening", error: "" });
  }
  async retry() {
    if (this.snapshot.state !== "error") return;
    this.update({ error: "" });
    if (!this.ready) {
      await this.start();
      return;
    }
    const operation = this.retryOperation;
    if (operation) await this.run(operation);
  }
  async end() {
    if (this.closed || this.snapshot.state === "ended") return;
    this.ending = true;
    if (this.snapshot.recording) {
      await this.finishRecording();
      return;
    }
    if (
      ["thinking", "transcribing"].includes(this.snapshot.state) &&
      this.ready
    ) {
      this.audio.mute(true);
      return;
    }
    await this.finishSession();
  }
  private async finishSession() {
    this.abort.abort();
    clearInterval(this.interval);
    await this.audio.destroy();
    this.ready = false;
    this.pendingAudio = null;
    this.update({ state: "ended", recording: false, intensity: 0 });
  }
  async destroy() {
    this.closed = true;
    this.abort.abort();
    clearInterval(this.interval);
    this.pendingAudio = null;
    await this.audio.destroy();
  }
  private fail(
    error: unknown,
    fallback = "The connection failed. Your text is still here. Retry when you are connected.",
  ) {
    if (this.closed || this.abort.signal.aborted) return;
    this.audio.mute(true);
    const denied =
      error instanceof Error &&
      ["NotAllowedError", "NotFoundError", "NotReadableError"].includes(
        error.name,
      );
    this.update({
      state: "error",
      error:
        denied || error instanceof TypeError
          ? fallback
          : error instanceof Error
            ? error.message
            : fallback,
      intensity: 0,
    });
  }
  private async run(operation: () => Promise<void>) {
    try {
      await operation();
    } catch (error) {
      this.fail(error);
    }
  }
}
import { notifyLearningActivity } from "./learning-activity";
