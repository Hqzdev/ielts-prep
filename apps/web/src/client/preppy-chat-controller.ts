import type { components } from "@veylo/api-client/types";
import { api, apiData } from "./api";
import { BrowserConversationAudio } from "./conversation-audio";
import type {
  ConversationMessage,
  PreppyState,
} from "@veylo/backend/domain/voice-conversation";
import { isVeyExpression } from "@veylo/backend/domain/vey-expressions";
import type { PreppyExpression } from "@veylo/backend/domain/preppy";

interface ChatSnapshot {
  messages: ConversationMessage[];
  threadId?: string;
  state: PreppyState;
  expression: PreppyExpression;
  busy: boolean;
  recording: boolean;
  intensity: number;
  roundness: number;
  error: string;
  playingId?: string;
}

export class PreppyChatController {
  private snapshot: ChatSnapshot = {
    messages: [],
    state: "idle",
    expression: "happy",
    busy: false,
    recording: false,
    intensity: 0,
    roundness: 0,
    error: "",
  };
  private listeners = new Set<() => void>();
  private abort = new AbortController();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private retryOperation: (() => Promise<void>) | undefined;
  private audio = new BrowserConversationAudio();
  private closed = false;
  private captureRevision = 0;
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(patch: Partial<ChatSnapshot>) {
    if (!this.closed) {
      this.snapshot = { ...this.snapshot, ...patch };
      this.listeners.forEach((listener) => listener());
    }
  }
  private level = (intensity: number, roundness = 0) =>
    this.update({ intensity, roundness });
  async send(content: string) {
    if (this.snapshot.busy || !content.trim()) return;
    const message = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: content.trim(),
      status: "pending",
    };
    this.update({ messages: [...this.snapshot.messages, message] });
    await this.run(() =>
      this.stream("/chat/messages", {
        threadId: this.snapshot.threadId,
        content: message.content,
      }),
    );
  }
  private async stream(
    path: "/chat/session" | "/chat/messages",
    body: components["schemas"]["ReplyToConversationRequest"],
  ) {
    this.update({ state: "thinking", busy: true, error: "" });
    this.retryOperation = () => this.stream(path, body);
    const response = await api.POST(path, {
      body: body,
      parseAs: "stream",
      signal: this.abort.signal,
    });
    const reader = response.data?.getReader();
    if (!reader) throw new Error("The reply was interrupted. Please retry.");
    const decoder = new TextDecoder();
    let pending = "";
    let assistantId = "";
    let complete = false;
    let failure = "";
    const accept = (line: string) => {
      if (!line.trim()) return;
      const event = JSON.parse(line);
      if (event.type === "thread") {
        notifyLearningActivity();
        assistantId = event.assistantId;
        this.retryOperation = () => this.recover(assistantId);
        this.update({
          threadId: event.threadId,
          messages: [
            ...this.snapshot.messages
              .filter((message) => message.id !== assistantId)
              .map((message) => ({
                ...message,
                status:
                  message.status === "pending" ? "complete" : message.status,
              })),
            {
              id: assistantId,
              role: "assistant",
              content: "",
              status: "streaming",
            },
          ],
        });
      }
      if (event.type === "expression" && isVeyExpression(event.expression))
        this.update({ expression: event.expression });
      if (event.type === "token")
        this.update({
          messages: this.snapshot.messages.map((message) =>
            message.id === assistantId
              ? { ...message, content: message.content + event.text }
              : message,
          ),
        });
      if (event.type === "error") failure = event.message;
      if (event.type === "done") complete = event.status === "complete";
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
    if (!complete || failure)
      throw new Error(
        failure ||
          "The reply was interrupted. Your text is still here. Please retry.",
      );
    this.update({
      busy: false,
      state: "idle",
      messages: this.snapshot.messages.map((message) =>
        message.id === assistantId
          ? { ...message, status: "complete" }
          : message,
      ),
    });
    this.retryOperation = undefined;
  }
  private async recover(assistantId: string) {
    const messages = await apiData(
      api.GET("/chat/threads/{id}/messages", {
        params: { path: { id: this.snapshot.threadId! } },
        signal: this.abort.signal,
      }),
    );
    this.update({ messages });
    const reply = messages.find((message) => message.id === assistantId);
    if (reply?.status === "complete") {
      this.update({ busy: false, state: "idle" });
      return;
    }
    if (reply?.status === "streaming")
      throw new Error("Vey is still saving the reply. Retry in a moment.");
    await this.stream("/chat/messages", {
      threadId: this.snapshot.threadId,
      retryAssistantId: assistantId,
    });
  }
  async record() {
    if (this.snapshot.busy) return;
    const revision = ++this.captureRevision;
    this.retryOperation = () => this.record();
    this.update({ busy: true, error: "" });
    await this.run(async () => {
      await this.audio.prepare(() => {}, this.level);
      if (revision !== this.captureRevision) return;
      if (!this.snapshot.threadId) await this.stream("/chat/session", {});
      if (this.closed || revision !== this.captureRevision) return;
      this.audio.record();
      this.update({ state: "listening", recording: true, busy: true });
      this.timer = setTimeout(() => void this.finishRecording(), 60000);
    });
    if (!this.snapshot.recording) await this.audio.destroy();
  }
  async finishRecording() {
    if (!this.snapshot.recording) return;
    clearTimeout(this.timer);
    this.update({ recording: false, state: "thinking", busy: true });
    const audio = await this.audio.stopRecording();
    await this.audio.destroy();
    this.retryOperation = async () => {
      const { text } = await apiData(
        api.POST("/chat/audio/transcribe", {
          params: { query: { thread: this.snapshot.threadId! } },
          headers: { "Content-Type": "audio/wav" },
          body: audio,
          signal: this.abort.signal,
        }),
      );
      this.update({ busy: false, state: "idle" });
      if (text.trim()) await this.send(text);
      else
        throw new Error("No speech was detected. Record your message again.");
    };
    await this.run(this.retryOperation);
  }
  async play(messageId: string) {
    if (this.snapshot.busy) return;
    this.retryOperation = () => this.play(messageId);
    this.update({
      busy: true,
      playingId: messageId,
      error: "",
      state: "speaking",
    });
    await this.run(async () => {
      await this.audio.preparePlayback(this.level);
      const { url } = await apiData(
        messageId === "welcome"
          ? api.POST("/chat/audio/welcome", {
              body: {},
              signal: this.abort.signal,
            })
          : api.POST("/chat/audio/speak", {
              body: { threadId: this.snapshot.threadId!, messageId },
              signal: this.abort.signal,
            }),
      );
      await this.audio.play(url, this.abort.signal);
      this.update({ busy: false, state: "idle", playingId: undefined });
      this.retryOperation = undefined;
    });
    await this.audio.destroy();
  }
  async retry() {
    const operation = this.retryOperation;
    if (operation) {
      this.update({ error: "", busy: false });
      await this.run(operation);
    }
  }
  private async run(operation: () => Promise<void>) {
    try {
      await operation();
    } catch (error) {
      if (!this.abort.signal.aborted)
        this.update({
          error:
            error instanceof Error
              ? error.message
              : "The connection failed. Please retry.",
          state: "error",
          busy: false,
          recording: false,
          playingId: undefined,
        });
    }
  }
  async suspend() {
    this.captureRevision++;
    clearTimeout(this.timer);
    this.update({
      recording: false,
      busy: false,
      playingId: undefined,
      state: "idle",
    });
    await this.audio.destroy();
  }
  async destroy() {
    this.captureRevision++;
    this.closed = true;
    this.abort.abort();
    clearTimeout(this.timer);
    this.retryOperation = undefined;
    await this.audio.destroy();
  }
}
import { notifyLearningActivity } from "./learning-activity";
