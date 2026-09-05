import { describe, expect, it } from "vitest";
import { DailyStreakCalculator } from "@veylo/backend/domain/daily-streak";

const calculator = new DailyStreakCalculator();
const now = new Date("2026-09-05T12:00:00Z");

describe("daily learning streak", () => {
  it("starts empty and marks the current local day", () => {
    const streak = calculator.calculate([], "UTC", now);
    expect(streak).toMatchObject({ current: 0, best: 0, todayComplete: false });
    expect(streak.week[5]).toEqual({
      date: "2026-09-05",
      label: "Sat",
      state: "today",
    });
    expect(streak.week[6].state).toBe("upcoming");
  });
  it("keeps yesterday's streak until the end of today", () => {
    expect(
      calculator.calculate(["2026-09-03", "2026-09-04"], "UTC", now),
    ).toMatchObject({ current: 2, best: 2, todayComplete: false });
  });
  it("counts each date once across different activities", () => {
    expect(
      calculator.calculate(
        ["2026-09-05", "2026-09-03", "2026-09-04", "2026-09-05"],
        "UTC",
        now,
      ),
    ).toMatchObject({ current: 3, best: 3, todayComplete: true });
  });
  it("resets after a missed day while preserving the best streak", () => {
    const dates = ["2026-09-01", "2026-09-02", "2026-09-03"];
    expect(calculator.calculate(dates, "UTC", now)).toMatchObject({
      current: 0,
      best: 3,
    });
    expect(
      calculator.calculate([...dates, "2026-09-05"], "UTC", now),
    ).toMatchObject({ current: 1, best: 3 });
  });
  it("uses local midnight instead of the browser or UTC date", () => {
    const instant = new Date("2026-09-05T20:00:00Z");
    expect(
      calculator.calculate(["2026-09-05"], "Asia/Yekaterinburg", instant),
    ).toMatchObject({ today: "2026-09-06", todayComplete: false, current: 1 });
    expect(
      calculator.calculate(["2026-09-05"], "America/Los_Angeles", instant),
    ).toMatchObject({ today: "2026-09-05", todayComplete: true, current: 1 });
  });
  it("keeps calendar continuity across DST, leap days and new years", () => {
    expect(
      calculator.calculate(
        ["2026-03-07", "2026-03-08", "2026-03-09"],
        "America/New_York",
        new Date("2026-03-09T14:00:00Z"),
      ).current,
    ).toBe(3);
    expect(
      calculator.calculate(
        ["2024-02-28", "2024-02-29", "2024-03-01"],
        "UTC",
        new Date("2024-03-01T12:00:00Z"),
      ).current,
    ).toBe(3);
    expect(
      calculator.calculate(
        ["2025-12-31", "2026-01-01"],
        "UTC",
        new Date("2026-01-01T12:00:00Z"),
      ).current,
    ).toBe(2);
  });
  it("ignores future records and keeps the longest historical run", () => {
    expect(
      calculator.calculate(
        ["2026-08-01", "2026-08-02", "2026-09-05", "2026-09-06"],
        "UTC",
        now,
      ),
    ).toMatchObject({ current: 1, best: 2, todayComplete: true });
  });
});
