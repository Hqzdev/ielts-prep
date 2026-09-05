import type { Task } from "./task";

export type CalibrationCase = {
  id: string;
  split: "tuning" | "holdout";
  source: string;
  expertBand: number;
  task: Task;
  answer: string;
  audio: { path: string; questionIndex: number }[];
};

export interface CalibrationMeasurement {
  id: string;
  split: "tuning" | "holdout";
  group: string;
  expertBand: number;
  bands: (number | null)[];
}

export class CalibrationEvaluator {
  summarize(measurements: CalibrationMeasurement[]) {
    return [...new Set(measurements.map((m) => m.group))].map((group) => {
      const members = measurements.filter((m) => m.group === group);
      const holdout = members.filter((m) => m.split === "holdout");
      const tuningCount = members.length - holdout.length;
      const errors = holdout.flatMap((m) =>
        typeof m.bands[0] !== "number"
          ? []
          : [Math.abs(m.bands[0] - m.expertBand)],
      );
      const mae = errors.length
        ? errors.reduce((sum, error) => sum + error, 0) / errors.length
        : null;
      const withinHalfBand = holdout.length
        ? errors.filter((error) => error <= 0.5).length / holdout.length
        : 0;
      const stable = holdout.every(
        (m) =>
          m.bands.length >= 2 &&
          m.bands.every((band) => band !== null) &&
          Math.max(...(m.bands as number[])) -
            Math.min(...(m.bands as number[])) <=
            0.5,
      );
      const complete = errors.length === holdout.length;
      return {
        group,
        tuningCount,
        holdoutCount: holdout.length,
        mae,
        withinHalfBand,
        stable,
        complete,
        passed:
          tuningCount >= 5 &&
          holdout.length >= 10 &&
          complete &&
          mae !== null &&
          mae <= 0.5 &&
          withinHalfBand >= 0.8 &&
          stable,
      };
    });
  }
  validate(cases: CalibrationCase[]) {
    if (new Set(cases.map((c) => c.id)).size !== cases.length)
      throw new Error("Duplicate calibration IDs");
    const fingerprints = new Set<string>();
    for (const sample of cases) {
      if (sample.task.skill === "reading")
        throw new Error("Reading uses deterministic assessment");
      if (
        sample.task.skill === "speaking"
          ? !sample.audio.length
          : !sample.answer.trim()
      )
        throw new Error(`Missing answer: ${sample.id}`);
      const fingerprint = JSON.stringify([
        sample.task.id,
        sample.answer,
        sample.audio,
      ]);
      if (fingerprints.has(fingerprint))
        throw new Error(
          "The same answer must not appear twice or cross dataset splits",
        );
      fingerprints.add(fingerprint);
    }
    return cases;
  }
}
