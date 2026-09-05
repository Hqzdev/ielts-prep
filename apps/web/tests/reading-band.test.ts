import { describe, expect, it } from "vitest";
import { authoredBank } from "@/content/bank";
import { ReadingBandCalculator } from "@veylo/backend/domain/reading-band";
import { ReadingGrader } from "@veylo/backend/domain/reading-grader";
import { StatisticsCalculator } from "@veylo/backend/domain/statistics";
import { mapAssessment } from "@veylo/backend/persistence/mapping";
import type { Attempt } from "@veylo/backend/domain/attempt";

const calculator = new ReadingBandCalculator();
const entry = authoredBank().find((item) => item.task.id === "rd-021")!;
const verdicts = new ReadingGrader().grade(
  entry.task,
  { text: "", audioIds: [], reading: { "1": "A", "2": ["A", "C"] } },
  entry.readingKey,
);
const assessmentRow = {
  id: "assessment",
  attempt_id: "original",
  user_id: "learner",
  status: "ready",
  band: null,
  grade: null,
  reading: verdicts,
  transcripts: [],
  model: null,
  rubric_version: "reading-key-v1",
  error_code: null,
  created_at: "2026-09-03T10:00:00Z",
  completed_at: "2026-09-03T10:05:00Z",
};

describe("Reading practice bands", () => {
  it("converts Academic raw marks at half-band boundaries", () => {
    const reference = [
      [0, 1],
      [1, 1],
      [2, 2],
      [3, 2.5],
      [4, 2.5],
      [5, 3],
      [6, 3],
      [7, 3.5],
      [9, 3.5],
      [10, 4],
      [12, 4],
      [13, 4.5],
      [15, 4.5],
      [16, 5],
      [19, 5],
      [20, 5.5],
      [22, 5.5],
      [23, 6],
      [26, 6],
      [27, 6.5],
      [29, 6.5],
      [30, 7],
      [32, 7],
      [33, 7.5],
      [34, 7.5],
      [35, 8],
      [36, 8],
      [37, 8.5],
      [38, 8.5],
      [39, 9],
      [40, 9],
    ];
    for (const [earned, band] of reference)
      expect(calculator.calculate([{ earned, possible: 40 }])).toBe(band);
  });

  it("projects short exercises to 40 marks and preserves partial-selection credit", () => {
    expect(calculator.calculate([{ earned: 7, possible: 8 }])).toBe(8);
    expect(calculator.calculate([{ earned: 6, possible: 8 }])).toBe(7);
    expect(calculator.calculate([{ earned: 2, possible: 8 }])).toBe(4);
    expect(verdicts.map(({ earned, possible }) => [earned, possible])).toEqual([
      [1, 1],
      [1, 2],
    ]);
    expect(calculator.calculate(verdicts)).toBe(6.5);
  });

  it("keeps missing or invalid marks unscored", () => {
    expect(calculator.calculate([])).toBeNull();
    for (const [earned, possible] of [
      [0, 0],
      [-1, 8],
      [9, 8],
      [1.5, 8],
      [NaN, 8],
      [1, Infinity],
    ])
      expect(calculator.calculate([{ earned, possible }])).toBeNull();
  });

  it("derives legacy Reading bands without changing stored scores or pending results", () => {
    const legacy = mapAssessment(assessmentRow);
    expect(legacy.band).toBe(6.5);
    expect(legacy.rubricVersion).toBe("reading-key-v1");
    expect(assessmentRow.band).toBeNull();
    expect(mapAssessment({ ...assessmentRow, band: 6 }).band).toBe(6);
    expect(
      mapAssessment({ ...assessmentRow, status: "queued" }).band,
    ).toBeNull();
    expect(mapAssessment({ ...assessmentRow, reading: null }).band).toBeNull();
  });

  it("tracks band progress separately from accuracy and excludes revisions", () => {
    const attempt: Attempt = {
      id: "original",
      userId: "learner",
      taskId: entry.task.id,
      taskVersion: entry.task.version,
      taskSnapshot: entry.task,
      mode: "practice",
      status: "completed",
      answer: { text: "", reading: {}, audioIds: [] },
      revision: 1,
      parentAttemptId: null,
      startedAt: assessmentRow.created_at,
      deadlineAt: null,
      submittedAt: assessmentRow.completed_at,
      elapsedSeconds: 300,
      activeSince: null,
      createdAt: assessmentRow.created_at,
      updatedAt: assessmentRow.completed_at,
    };
    const statistics = new StatisticsCalculator().calculate(
      [attempt, { ...attempt, id: "revision", parentAttemptId: attempt.id }],
      [
        mapAssessment(assessmentRow),
        mapAssessment({
          ...assessmentRow,
          id: "revised",
          attempt_id: "revision",
          band: 9,
        }),
      ],
    );
    const reading = statistics.skills.find(
      (skill) => skill.skill === "reading",
    )!;
    expect(reading).toMatchObject({
      unit: "band",
      latest: 6.5,
      average: 6.5,
      count: 1,
    });
    expect(reading.series[0].value).toBe(6.5);
    expect(reading.formats[0]).toMatchObject({ correct: 2, total: 3 });
    expect(reading.formats[0].accuracy).toBeCloseTo(66.67, 2);
    expect(statistics.revisionCount).toBe(1);
  });
});
