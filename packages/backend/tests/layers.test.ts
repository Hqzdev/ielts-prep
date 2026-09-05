import { describe, expect, it, vi } from "vitest";
import { DailyStreakService } from "../src/application/services/daily-streak";
import { ArcadeProgressService } from "../src/application/services/arcade-progress";
import { AccessPolicy } from "../src/domain/access-policy";
import { AssessmentService } from "../src/application/services/assessment";
import type { Profile } from "../src/domain/profile";
import type { Assessment } from "../src/domain/assessment";
import type { EvaluationStore } from "../src/application/ports/assessment";
import type { PracticeStore } from "../src/application/ports/practice";
import type {
  RecordingStore,
  AudioStorage,
} from "../src/application/ports/audio";

const clock = { now: () => new Date("2026-09-05T20:00:00Z") };

describe("application dependency boundaries", () => {
  it("calculates a learner day using injected time and a storage port", async () => {
    const dates = vi.fn(async () => ["2026-09-04", "2026-09-05"]);
    const service = new DailyStreakService({ activityDates: dates }, clock);
    expect(await service.get("learner", "Asia/Yekaterinburg")).toMatchObject({
      today: "2026-09-06",
      todayComplete: false,
      current: 2,
    });
    expect(dates).toHaveBeenCalledWith("learner");
  });

  it("does not award the same round twice and respects the persisted concurrent result", async () => {
    const round = {
      id: "round",
      game: "runner" as const,
      targetSeconds: 30,
      startedAt: "2026-09-05T19:59:30Z",
      finishedAt: null,
      completed: false,
    };
    const store = {
      start: vi.fn(),
      round: vi.fn(async () => round),
      finish: vi.fn(async () => false),
    };
    const service = new ArcadeProgressService(store, clock);
    expect(
      await service.finish("learner", "round", {
        elapsed: 30,
        speechSeconds: 0,
        answers: 8,
      }),
    ).toEqual({ saved: true, completed: false });
    store.round.mockResolvedValueOnce({
      ...round,
      completed: true,
      finishedAt: clock.now().toISOString(),
    } as never);
    expect(
      await service.finish("learner", "round", {
        elapsed: 30,
        speechSeconds: 0,
        answers: 8,
      }),
    ).toEqual({ saved: true, completed: true });
    expect(store.finish).toHaveBeenCalledOnce();
  });

  it("keeps membership and administrator authorization identical for every identity source", () => {
    const policy = new AccessPolicy();
    const member = {
      id: "learner",
      betaAccess: true,
      role: "student",
    } as Profile;
    expect(policy.require(member)).toBe(member);
    expect(() => policy.require(null)).toThrow("Please sign in");
    expect(() => policy.require({ ...member, betaAccess: false })).toThrow(
      "invitation",
    );
    expect(() => policy.admin(member)).toThrow("permission");
    expect(policy.admin({ ...member, role: "admin" }).role).toBe("admin");
  });

  it("finishes an already persisted assessment without asking the AI to grade it again", async () => {
    const assessment = {
      id: "assessment",
      userId: "learner",
      attemptId: "attempt",
      status: "ready",
    } as Assessment;
    const store: EvaluationStore = {
      assessment: vi.fn(async () => assessment),
      begin: vi.fn(),
      complete: vi.fn(),
      finalize: vi.fn(),
      recordError: vi.fn(),
      fail: vi.fn(),
    };
    const provider = vi.fn();
    const service = new AssessmentService(
      store,
      {} as PracticeStore,
      {} as RecordingStore,
      {} as AudioStorage,
      { available: true, provider },
      {
        canAssess: () => true,
        dailyAssessmentLimit: 5,
        textModel: "test",
        audioModel: "test",
      },
      { classify: () => ({ code: "PROVIDER_ERROR", retryable: true }) },
      clock,
      { fingerprint: vi.fn(), base64: vi.fn() },
    );
    await service.evaluate("assessment", 2);
    expect(store.finalize).toHaveBeenCalledWith(assessment, clock.now());
    expect(provider).not.toHaveBeenCalled();
    expect(store.complete).not.toHaveBeenCalled();
  });
});
