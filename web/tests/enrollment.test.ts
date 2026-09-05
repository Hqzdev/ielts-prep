import { describe, expect, it } from "vitest";
import { EnrollmentDraft } from "../src/client/enrollment-draft";

describe("registration draft", () => {
  it("recovers malformed or invalid browser data", () => {
    expect(EnrollmentDraft.decode("broken").targetBand).toBe(7);
    expect(EnrollmentDraft.decode('{"targetBand":99}').targetBand).toBe(7);
  });
  it("saves a validated plan and clears it after onboarding", () => {
    const values = new Map<string, string>();
    const draft = new EnrollmentDraft({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => {
        values.set(key, value);
      },
      removeItem: (key) => {
        values.delete(key);
      },
    });
    expect(draft.exists()).toBe(false);
    draft.save({
      ...draft.read(),
      name: "Alex",
      targetBand: 8,
      dailyMinutes: 60,
    });
    expect(draft.read()).toMatchObject({
      name: "Alex",
      targetBand: 8,
      dailyMinutes: 60,
    });
    expect(draft.exists()).toBe(true);
    draft.clear();
    expect(draft.exists()).toBe(false);
  });
});
