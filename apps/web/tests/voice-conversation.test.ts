import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ConversationTiming,
  preppyStateFor,
} from "@veylo/backend/domain/voice-conversation";
import { VoiceConversationController } from "@/client/voice-conversation-controller";
import type { ConversationAudio } from "@/client/conversation-audio";
import { WavCodec } from "@veylo/backend/domain/wav";

class FakeAudio implements ConversationAudio {
  prepare = vi.fn(async () => {});
  record = vi.fn();
  stopRecording = vi.fn(
    async () => new Blob([new WavCodec().encode(new Float32Array(16000))]),
  );
  play = vi.fn(async () => {});
  mute = vi.fn();
  destroy = vi.fn(async () => {});
}
const reply = (text = "Hi, I’m Preppy. Where do you live?") =>
  new Response(
    [
      { type: "thread", threadId: "thread-1", assistantId: "reply-1" },
      { type: "token", text },
      { type: "done", status: "complete" },
    ]
      .map((event) => JSON.stringify(event))
      .join("\n") + "\n",
  );
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
let audio: FakeAudio;
let controller: VoiceConversationController;
let request: ReturnType<typeof vi.fn>;
const settle = async () => {
  for (let i = 0; i < 35; i++) await Promise.resolve();
};
beforeEach(() => {
  vi.useFakeTimers();
  audio = new FakeAudio();
  controller = new VoiceConversationController(audio);
  request = vi.fn(async (input: Request) => {
    const url = input.url;
    return url.includes("/speak")
      ? json({ url: "/test.wav" })
      : url.includes("/transcribe")
        ? json({ text: "I live in London." })
        : reply();
  });
  vi.stubGlobal("fetch", request);
});
afterEach(async () => {
  await controller.destroy();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("conversation timing", () => {
  it("maps every conversation stage to the correct Preppy expression", () => {
    expect(
      [
        "setup",
        "listening",
        "transcribing",
        "thinking",
        "speaking",
        "ended",
        "error",
      ].map((state) =>
        preppyStateFor(state as Parameters<typeof preppyStateFor>[0]),
      ),
    ).toEqual([
      "idle",
      "listening",
      "thinking",
      "thinking",
      "speaking",
      "success",
      "error",
    ]);
  });
  it("waits for 1.5 seconds of silence, resets on speech and caps both modes at 60 seconds", () => {
    let now = 0;
    const timing = new ConversationTiming(() => now);
    timing.start();
    timing.begin();
    now = 1499;
    expect(timing.shouldFinish("hands-free")).toBe(false);
    timing.speech();
    now = 2998;
    expect(timing.shouldFinish("hands-free")).toBe(false);
    now = 2999;
    expect(timing.shouldFinish("hands-free")).toBe(true);
    expect(timing.shouldFinish("hold")).toBe(false);
    now = 60000;
    expect(timing.shouldFinish("hold")).toBe(true);
    timing.finish();
    expect(timing.recording).toBe(false);
    now = 600000;
    expect(timing.remaining).toBe(0);
  });
});

describe("voice session", () => {
  it("starts only explicitly, streams the greeting, plays it and then enables listening", async () => {
    expect(audio.prepare).not.toHaveBeenCalled();
    const stages: string[] = [];
    controller.subscribe(() => stages.push(controller.getSnapshot().state));
    await controller.start();
    expect(new URL(request.mock.calls[0][0].url).pathname).toBe(
      "/api/v1/chat/session",
    );
    expect(stages).toContain("thinking");
    expect(stages).toContain("speaking");
    expect(controller.getSnapshot().state).toBe("listening");
    expect(controller.getSnapshot().messages).toHaveLength(1);
    expect(audio.mute).toHaveBeenLastCalledWith(false);
  });
  it("starts hands-free recording on speech and submits after silence", async () => {
    await controller.start();
    controller.speech(true);
    expect(audio.record).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1499);
    expect(audio.stopRecording).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(101);
    expect(audio.stopRecording).toHaveBeenCalledOnce();
    expect(
      request.mock.calls.some(([input]) => input.url.includes("transcribe")),
    ).toBe(true);
    expect(
      controller
        .getSnapshot()
        .messages.some(
          (message) =>
            message.role === "user" && message.content === "I live in London.",
        ),
    ).toBe(true);
  });
  it("records while Space is held, ignores repeats and ignores editable targets", async () => {
    await controller.start();
    controller.setMode("hold");
    const preventDefault = vi.fn();
    const event = {
      code: "Space",
      repeat: false,
      target: null,
      preventDefault,
    };
    controller.keyDown({
      ...event,
      target: { tagName: "INPUT" } as unknown as EventTarget,
    });
    expect(audio.record).not.toHaveBeenCalled();
    controller.keyDown(event);
    controller.keyDown({ ...event, repeat: true });
    expect(audio.record).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1600);
    expect(audio.stopRecording).not.toHaveBeenCalled();
    controller.keyUp(event);
    await settle();
    expect(audio.stopRecording).toHaveBeenCalledOnce();
  });
  it("finishes an active answer at the session deadline and saves its text without starting another turn", async () => {
    await controller.start();
    controller.setMode("hold");
    await vi.advanceTimersByTimeAsync(599000);
    controller.press();
    await vi.advanceTimersByTimeAsync(1000);
    expect(controller.getSnapshot().remaining).toBe(0);
    expect(controller.getSnapshot().recording).toBe(true);
    controller.release();
    await settle();
    expect(controller.getSnapshot().state).toBe("ended");
    expect(audio.destroy).toHaveBeenCalled();
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(
      controller
        .getSnapshot()
        .messages.some((message) => message.role === "user"),
    ).toBe(true);
  });
  it("ends an idle conversation at ten minutes", async () => {
    await controller.start();
    await vi.advanceTimersByTimeAsync(600000);
    expect(controller.getSnapshot().state).toBe("ended");
    expect(audio.destroy).toHaveBeenCalled();
  });
  it("retains the reply and retries only playback when TTS fails", async () => {
    let fail = true;
    request.mockImplementation(async (input: Request) => {
      const url = input.url;
      return url.includes("/speak")
        ? fail
          ? json({ error: { message: "Audio unavailable" } }, 502)
          : json({ url: "/test.wav" })
        : reply();
    });
    await controller.start();
    expect(controller.getSnapshot().state).toBe("error");
    expect(controller.getSnapshot().messages[0].content).toContain("Preppy");
    fail = false;
    await controller.retry();
    expect(controller.getSnapshot().state).toBe("listening");
    expect(
      request.mock.calls.filter(
        ([input]) => new URL(input.url).pathname === "/api/v1/chat/session",
      ),
    ).toHaveLength(1);
  });
  it("keeps denied microphone access recoverable and stops resources", async () => {
    audio.prepare.mockRejectedValueOnce(
      new DOMException("Permission denied", "NotAllowedError"),
    );
    await controller.start();
    expect(controller.getSnapshot().error).toContain("Allow microphone");
    expect(audio.destroy).toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
    await controller.retry();
    expect(controller.getSnapshot().state).toBe("listening");
  });
  it("stops a held answer at sixty seconds without starting another recording", async () => {
    await controller.start();
    controller.setMode("hold");
    controller.press();
    await vi.advanceTimersByTimeAsync(60000);
    expect(audio.stopRecording).toHaveBeenCalledOnce();
    expect(controller.getSnapshot().recording).toBe(false);
    expect(audio.record).toHaveBeenCalledOnce();
  });
  it("retries transcription from memory without losing earlier replies", async () => {
    await controller.start();
    const greeting = controller.getSnapshot().messages[0].content;
    request.mockImplementationOnce(async () => {
      throw new TypeError("Failed to fetch");
    });
    controller.setMode("hold");
    controller.press();
    controller.release();
    await settle();
    expect(controller.getSnapshot().state).toBe("error");
    expect(controller.getSnapshot().error).toContain("connection");
    expect(controller.getSnapshot().messages[0].content).toBe(greeting);
    await controller.retry();
    expect(controller.getSnapshot().state).toBe("listening");
    expect(audio.record).toHaveBeenCalledOnce();
    expect(audio.stopRecording).toHaveBeenCalledOnce();
  });
  it("does not submit recordings after unmount", async () => {
    await controller.start();
    controller.speech(true);
    const count = request.mock.calls.length;
    await controller.destroy();
    await vi.advanceTimersByTimeAsync(61000);
    expect(request).toHaveBeenCalledTimes(count);
    expect(audio.destroy).toHaveBeenCalled();
  });
});
