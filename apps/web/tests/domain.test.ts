import { describe, it, expect } from "vitest";
import { authoredBank } from "@/content/bank";
import { vocabularyBank } from "@/content/vocabulary";
import { ContentValidator } from "@veylo/backend/validation/content-validator";
import { ReadingGrader } from "@veylo/backend/domain/reading-grader";
import { BandCalculator } from "@veylo/backend/domain/assessment";
import { GradeValidator } from "@veylo/backend/validation/grade-validator";
import { AttemptClock, type Attempt } from "@veylo/backend/domain/attempt";
import { ArcadeEngine } from "@veylo/ui-web/domain/arcade";
import { WavCodec } from "@veylo/backend/domain/wav";
import {
  WeeklyPlanner,
  localDate,
  weekStart,
} from "@veylo/backend/domain/planner";
import { StatisticsCalculator } from "@veylo/backend/domain/statistics";
import type { Profile } from "@veylo/backend/domain/profile";

const bank = authoredBank();
const attempt: Attempt = {
  id: "a",
  userId: "u",
  taskId: "w2-001",
  taskVersion: 1,
  taskSnapshot: bank.find((e) => e.task.id === "w2-001")!.task,
  mode: "strict",
  status: "in_progress",
  answer: { text: "This are an example.", reading: {}, audioIds: [] },
  revision: 0,
  parentAttemptId: null,
  startedAt: "2026-09-03T10:00:00Z",
  deadlineAt: "2026-09-03T10:40:00Z",
  submittedAt: null,
  elapsedSeconds: 0,
  activeSince: "2026-09-03T10:00:00Z",
  createdAt: "2026-09-03T10:00:00Z",
  updatedAt: "2026-09-03T10:00:00Z",
};

describe("content and deterministic assessment", () => {
  it("validates all 146 tasks, 14 Reading formats and their evidence", () => {
    expect(new ContentValidator().validate(bank)).toHaveLength(146);
    expect(
      new Set(
        bank
          .filter((e) => e.task.skill === "reading")
          .map((e) => e.task.format),
      ).size,
    ).toBe(14);
  });
  it("contains 15 usable vocabulary topics with 20 contextual entries", () => {
    const words = vocabularyBank();
    expect(words).toHaveLength(300);
    const topics = [...new Set(words.map((w) => w.topic))];
    expect(topics).toHaveLength(15);
    for (const topic of topics)
      expect(words.filter((w) => w.topic === topic)).toHaveLength(20);
    for (const word of words) {
      expect(word.gap_sentence).toContain("______");
      expect(word.example.toLowerCase()).toContain(word.term);
    }
  });
  it("gives partial points for multiple selection without rewarding duplicates or excess options", () => {
    const entry = bank.find((e) => e.task.id === "rd-021")!;
    const grader = new ReadingGrader();
    const answer = {
      text: "",
      audioIds: [],
      reading: { "1": "A", "2": ["A", "C"] },
    };
    expect(grader.grade(entry.task, answer, entry.readingKey)[1]).toMatchObject(
      { earned: 1, possible: 2, correct: false },
    );
    answer.reading["2"] = ["A", "A"];
    expect(grader.grade(entry.task, answer, entry.readingKey)[1].earned).toBe(
      1,
    );
    answer.reading["2"] = ["A", "B", "C"];
    expect(grader.grade(entry.task, answer, entry.readingKey)[1].earned).toBe(
      0,
    );
  });
  it("enforces word limits but ignores case and extra whitespace", () => {
    const entry = bank.find((e) => e.task.format === "sentence_completion")!;
    const grader = new ReadingGrader();
    expect(
      grader.grade(
        entry.task,
        { text: "", audioIds: [], reading: { "1": "  RAILWAY   OFFICE " } },
        entry.readingKey,
      )[0].correct,
    ).toBe(true);
    expect(
      grader.grade(
        entry.task,
        {
          text: "",
          audioIds: [],
          reading: { "1": "a disused railway office" },
        },
        entry.readingKey,
      )[0],
    ).toMatchObject({ correct: false, earned: 0 });
  });
  it("calculates a half-band only when all four criteria are present", () => {
    const calculator = new BandCalculator();
    expect(calculator.calculate([6, 6.5, 7, 7])).toBe(6.5);
    expect(calculator.calculate([6, 7, 7])).toBeNull();
    expect(calculator.calculate([0, 7, 7, 7])).toBeNull();
  });
  it("rejects invented quotations and pronunciation without audio", () => {
    const grade = {
      sufficientEvidence: true,
      insufficientReason: null,
      criteria: ["task_response", "coherence", "vocabulary", "grammar"].map(
        (key) => ({ key, label: key, score: 6, explanation: "Feedback" }),
      ),
      errors: [
        {
          category: "grammar",
          subcategory: "Agreement",
          issue: "Agreement",
          correction: "This is an example.",
          anchor: { type: "text", quote: "This are" },
        },
      ],
      strengths: [],
      nextFocus: "Agreement",
      fulfilledRequirements: [],
    };
    expect(new GradeValidator().validate(grade, attempt, [], {})).toBeTruthy();
    grade.errors[0].anchor.quote = "I have never written this";
    expect(() =>
      new GradeValidator().validate(grade, attempt, [], {}),
    ).toThrow();
    const speaking = {
      ...attempt,
      taskSnapshot: bank.find((e) => e.task.skill === "speaking")!.task,
    };
    grade.errors = [];
    grade.criteria = ["fluency", "vocabulary", "grammar", "pronunciation"].map(
      (key) => ({ key, label: key, score: 6, explanation: "Feedback" }),
    );
    expect(() =>
      new GradeValidator().validate(grade, speaking, [], {}),
    ).toThrow();
  });
});
describe("time, plans and speech practice", () => {
  it("keeps the original strict deadline after a reload", () => {
    const clock = new AttemptClock();
    expect(clock.remaining(attempt, Date.parse("2026-09-03T10:39:00Z"))).toBe(
      60,
    );
    expect(clock.expired(attempt, Date.parse("2026-09-03T10:40:01Z"))).toBe(
      true,
    );
    expect(
      clock.elapsed(
        {
          ...attempt,
          mode: "practice",
          status: "paused",
          elapsedSeconds: 90,
          activeSince: null,
        },
        Date.now(),
      ),
    ).toBe(90);
  });
  it("uses the learner's local day around midnight", () => {
    expect(
      localDate("Asia/Yekaterinburg", new Date("2026-09-03T21:00:00Z")),
    ).toBe("2026-09-04");
    expect(weekStart("2026-09-06")).toBe("2026-08-31");
  });
  it("splits Writing across short practice windows without exceeding daily time", () => {
    const profile: Profile = {
      id: "u",
      email: "test@example.com",
      name: "Test",
      role: "student",
      betaAccess: true,
      onboarded: true,
      targetBand: 7,
      selfReportedBand: null,
      examDate: null,
      dailyMinutes: 10,
      studyDays: [1, 2, 3, 4, 5, 6, 0],
      timezone: "UTC",
    };
    const plan = new WeeklyPlanner().plan(
      profile,
      bank.map((e) => e.task),
      [],
      [],
      "2026-09-03",
    );
    expect(plan.length).toBeGreaterThan(0);
    for (const day of new Set(plan.map((p) => p.scheduledDate)))
      expect(
        plan
          .filter((p) => p.scheduledDate === day)
          .reduce((n, p) => n + p.plannedMinutes, 0),
      ).toBeLessThanOrEqual(10);
    expect(plan[0].taskId).toBe(plan[1].taskId);
    const statistics = new StatisticsCalculator()
      .calculate([], [])
      .skills.map((skill) => ({
        ...skill,
        count: 5,
        average: skill.skill === "reading" ? 8 : 6,
      }));
    const targeted = new WeeklyPlanner().plan(
      profile,
      bank.map((e) => e.task),
      [],
      statistics,
      "2026-09-03",
    );
    expect(bank.find((e) => e.task.id === targeted[0].taskId)?.task.skill).toBe(
      "writing",
    );
  });
  it("does not add corrected attempts to independent progress", () => {
    const statistics = new StatisticsCalculator().calculate(
      [
        { ...attempt, status: "completed" },
        { ...attempt, id: "b", status: "completed", parentAttemptId: "a" },
      ],
      [],
    );
    expect(statistics.independentCount).toBe(1);
    expect(statistics.revisionCount).toBe(1);
  });
  it("allows two seconds of silence then ends a silent round on collision", () => {
    const engine = new ArcadeEngine();
    const initial = engine.snapshot.ballY;
    expect(engine.advance(2, false).ballY).toBe(initial);
    const state = engine.advance(10, false);
    expect(state.finished).toBe(true);
    expect(state.completed).toBe(false);
    expect(state.elapsed).toBeLessThan(10);
  });
  it("completes two minutes of speech without volume-dependent scoring", () => {
    const state = new ArcadeEngine().advance(120, true);
    expect(state.completed).toBe(true);
    expect(state.elapsed).toBe(120);
    expect(state.speechSeconds).toBeCloseTo(120, 2);
  });
  it("encodes mono PCM and rejects a tampered WAV header", () => {
    const codec = new WavCodec();
    const buffer = codec.encode(new Float32Array(16000));
    expect(codec.inspect(buffer)).toEqual({ sampleRate: 16000, duration: 1 });
    new DataView(buffer).setUint16(22, 2, true);
    expect(() => codec.inspect(buffer)).toThrow("INVALID_WAV");
  });
});
