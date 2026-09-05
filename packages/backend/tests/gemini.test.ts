import { beforeEach, describe, expect, it, vi } from "vitest";
import { GeminiProvider } from "@veylo/backend/ai/gemini";
import { authoredBank } from "@/content/bank";
import type { Attempt } from "@veylo/backend/domain/attempt";
import { CalibrationEvaluator } from "@veylo/backend/domain/calibration";

const { generate } = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: generate };
  },
}));
const settings = {
  key: "test-key",
  textModel: "test-model",
  audioModel: "test-audio",
  ttsModel: "test-tts",
  voice: "Kore",
};
const task = authoredBank().find((entry) => entry.task.id === "w2-001")!.task;
const now = "2026-09-03T10:00:00Z";
const attempt: Attempt = {
  id: "test",
  userId: "test",
  taskId: task.id,
  taskSnapshot: task,
  taskVersion: 1,
  mode: "practice",
  status: "submitted",
  answer: {
    text: "Students needs reliable information.",
    reading: {},
    audioIds: [],
  },
  revision: 1,
  parentAttemptId: null,
  startedAt: now,
  deadlineAt: null,
  submittedAt: now,
  elapsedSeconds: 40,
  activeSince: null,
  createdAt: now,
  updatedAt: now,
};
const grade = {
  sufficientEvidence: true,
  insufficientReason: null,
  criteria: ["task_response", "coherence", "vocabulary", "grammar"].map(
    (key) => ({ key, label: key, score: 6, explanation: "Contract check" }),
  ),
  errors: [
    {
      category: "grammar",
      subcategory: "agreement",
      issue: "Subject–verb agreement",
      correction: "Students need",
      anchor: { type: "text", quote: "Students needs" },
    },
  ],
  strengths: [],
  nextFocus: "Agreement",
  fulfilledRequirements: [],
};
beforeEach(() => {
  generate.mockReset();
});

describe("provider response contract", () => {
  it("repairs invalid JSON exactly once and validates literal evidence", async () => {
    generate
      .mockResolvedValueOnce({ text: "not json" })
      .mockResolvedValueOnce({ text: JSON.stringify(grade) });
    expect(await new GeminiProvider(settings).assess(attempt, [], [])).toEqual(
      grade,
    );
    expect(generate).toHaveBeenCalledTimes(2);
  });
  it("turns a second malformed response into a fatal validation code", async () => {
    generate.mockResolvedValue({ text: JSON.stringify({ criteria: [] }) });
    await expect(
      new GeminiProvider(settings).assess(attempt, [], []),
    ).rejects.toMatchObject({ code: "INVALID_AI_RESPONSE" });
    expect(generate).toHaveBeenCalledTimes(2);
  });
  it("repairs out-of-range transcript timestamps without inventing speech", async () => {
    generate
      .mockResolvedValueOnce({
        text: JSON.stringify({
          audioId: "a",
          text: "Hello",
          segments: [{ text: "Hello", startSeconds: 0, endSeconds: 99 }],
        }),
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({ audioId: "a", text: "", segments: [] }),
      });
    expect(
      await new GeminiProvider(settings).transcribe({
        id: "a",
        duration: 2,
        questionIndex: 0,
        base64: "audio-fixture",
      }),
    ).toEqual({ audioId: "a", text: "", segments: [] });
    expect(generate).toHaveBeenCalledTimes(2);
  });
  it("does not retry configuration errors or create a client without a key", async () => {
    expect(() => new GeminiProvider({ ...settings, key: "" })).toThrow(
      "AI is not connected yet",
    );
    generate.mockRejectedValue({ status: 401 });
    await expect(
      new GeminiProvider(settings).assess(attempt, [], []),
    ).rejects.toMatchObject({ status: 401 });
    expect(generate).toHaveBeenCalledTimes(1);
  });
});

describe("expert evaluation gate", () => {
  const measurements = Array.from({ length: 15 }, (_, i) => ({
    id: String(i),
    group: "writing-2",
    split: i < 5 ? ("tuning" as const) : ("holdout" as const),
    expertBand: 6,
    bands: [6, 6.5],
  }));
  it("requires enough independent work, accuracy and repeatability together", () => {
    const evaluator = new CalibrationEvaluator();
    expect(evaluator.summarize(measurements)[0].passed).toBe(true);
    expect(evaluator.summarize(measurements.slice(0, 10))[0].passed).toBe(
      false,
    );
    expect(
      evaluator.summarize(measurements.map((m) => ({ ...m, bands: [6, 8] })))[0]
        .passed,
    ).toBe(false);
    expect(
      evaluator.summarize(
        measurements.map((m) => ({ ...m, bands: [null, null] })),
      )[0].passed,
    ).toBe(false);
    expect(
      evaluator.summarize(measurements.map((m) => ({ ...m, bands: [7, 7] })))[0]
        .passed,
    ).toBe(false);
  });
});
