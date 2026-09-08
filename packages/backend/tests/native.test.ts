import { describe, expect, it } from "vitest";
import {
  NativeOnboardingRules,
  type NativeAnswers,
} from "../src/domain/native-profile";
import { NativeForecast } from "../src/domain/native-forecast";
import { nativeAnswersSchema } from "@veylo/contracts/schemas/native";
import { GigaChatProvider } from "../src/infrastructure/ai/gigachat";
import type { GigaTransport } from "../src/infrastructure/ai/gigachat-transport";
import type { Attempt } from "../src/domain/attempt";
import { authoredBank } from "@/content/bank";

const answers: NativeAnswers = {
  startingLevel: "unknown",
  targetBand: 8,
  examStatus: "not_booked",
  examDate: null,
  focus: ["reading"],
  barrier: "private",
};
const rules = new NativeOnboardingRules();
describe("native onboarding", () => {
  it("normalizes omitted Swift nullable answers and rejects unsupported targets", () => {
    const parsed = nativeAnswersSchema.parse({
      examStatus: "unanswered",
      focus: [],
    });
    expect(parsed.targetBand).toBeNull();
    expect(parsed.startingLevel).toBeNull();
    expect(parsed.examDate).toBeNull();
    expect(parsed.barrier).toBeNull();
    expect(
      nativeAnswersSchema.safeParse({ ...answers, targetBand: 6.7 }).success,
    ).toBe(false);
  });
  it("accepts honest unknown answers without creating a score", () => {
    expect(() => rules.validateCompletion(answers, "2026-09-08")).not.toThrow();
    expect(answers.startingLevel).toBe("unknown");
  });
  it("rejects hidden skills and duplicate choices", () => {
    expect(
      nativeAnswersSchema.safeParse({ ...answers, focus: ["speaking"] })
        .success,
    ).toBe(false);
    expect(
      nativeAnswersSchema.safeParse({
        ...answers,
        focus: ["reading", "reading"],
      }).success,
    ).toBe(false);
  });
  it("requires an explicit date decision", () => {
    expect(
      rules.validStep(
        2,
        { ...answers, examStatus: "unanswered" },
        "2026-09-08",
      ),
    ).toBe(false);
    expect(
      rules.validStep(
        2,
        { ...answers, examStatus: "scheduled", examDate: "2026-09-07" },
        "2026-09-08",
      ),
    ).toBe(false);
  });
  it("resumes the first incomplete question", () => {
    expect(
      rules.resumeStep({ ...answers, targetBand: null }, "2026-09-08"),
    ).toBe(1);
  });
});
describe("native forecast", () => {
  const forecast = new NativeForecast();
  const now = new Date("2026-09-08T12:00:00Z");
  const rows = [1, 4, 8].map((day, i) => ({
    date: "2026-09-" + String(day).padStart(2, "0"),
    band: 6 + i * 0.5,
    format: "2:essay",
  }));
  it("projects only an improving comparable skill", () => {
    expect(forecast.calculate("writing", 8, rows, now).reason).toBe(
      "projected",
    );
    expect(
      forecast.calculate("writing", 8, rows, now).estimatedDate,
    ).not.toBeNull();
  });
  it("does not treat three same-day results as a trend", () => {
    expect(
      forecast.calculate(
        "reading",
        8,
        rows.map((row) => ({ ...row, date: "2026-09-08" })),
        now,
      ).reason,
    ).toBe("insufficient_data");
  });
  it("does not invent dates for a flat trend", () => {
    expect(
      forecast.calculate(
        "reading",
        8,
        rows.map((row) => ({ ...row, band: 6 })),
        now,
      ).reason,
    ).toBe("no_growth");
  });
  it("does not mix task formats", () => {
    expect(
      forecast.calculate(
        "writing",
        8,
        rows.map((row, i) => ({ ...row, format: String(i) })),
        now,
      ).reason,
    ).toBe("insufficient_data");
  });
});
class RecordedTransport implements GigaTransport {
  calls: Record<string, unknown>[] = [];
  constructor(private readonly responses: unknown[]) {}
  async json(body: Record<string, unknown>) {
    this.calls.push(body);
    return this.responses.shift();
  }
  async *stream(body: Record<string, unknown>) {
    this.calls.push(body);
    yield { text: "Try identifying the main claim." };
  }
}
const task = authoredBank().find((entry) => entry.task.id === "w2-001")!.task;
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
  startedAt: "2026-09-08T00:00:00Z",
  deadlineAt: null,
  submittedAt: "2026-09-08T00:01:00Z",
  elapsedSeconds: 60,
  activeSince: null,
  createdAt: "2026-09-08T00:00:00Z",
  updatedAt: "2026-09-08T00:01:00Z",
};
const grade = {
  sufficientEvidence: true,
  insufficientReason: null,
  criteria: ["task_response", "coherence", "vocabulary", "grammar"].map(
    (key) => ({
      key,
      label: key,
      score: 6,
      explanation: "Development is limited.",
    }),
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
const response = (content: unknown) => ({
  choices: [{ message: { content: JSON.stringify(content) } }],
});
describe("GigaChat Writing", () => {
  it("validates exact evidence and uses the assigned model", async () => {
    const transport = new RecordedTransport([response(grade)]);
    expect(
      await new GigaChatProvider(transport, "GigaChat-2-Max").assessWriting(
        attempt,
      ),
    ).toEqual(grade);
    expect(transport.calls[0].model).toBe("GigaChat-2-Max");
    expect(transport.calls[0].response_format).toMatchObject({
      type: "json_schema",
      strict: true,
    });
  });
  it("repairs invalid structure once", async () => {
    const transport = new RecordedTransport([response({}), response(grade)]);
    expect(
      await new GigaChatProvider(transport, "GigaChat-2-Max").assessWriting(
        attempt,
      ),
    ).toEqual(grade);
    expect(transport.calls).toHaveLength(2);
  });
  it("rejects invented quotations after one bounded repair", async () => {
    const invented = {
      ...grade,
      errors: [
        {
          ...grade.errors[0],
          anchor: { type: "text", quote: "Invented evidence" },
        },
      ],
    };
    const transport = new RecordedTransport([
      response(invented),
      response(invented),
    ]);
    await expect(
      new GigaChatProvider(transport, "GigaChat-2-Max").assessWriting(attempt),
    ).rejects.toThrow();
    expect(transport.calls).toHaveLength(2);
  });
  it("never uses the Writing provider to assess speech", async () => {
    const transport = new RecordedTransport([]);
    await expect(
      new GigaChatProvider(transport, "GigaChat-2-Max").assessWriting({
        ...attempt,
        taskSnapshot: { ...task, skill: "speaking" },
      }),
    ).rejects.toMatchObject({ code: "SKILL_UNAVAILABLE" });
    expect(transport.calls).toHaveLength(0);
  });
});
