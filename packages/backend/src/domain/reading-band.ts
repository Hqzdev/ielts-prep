import type { ReadingVerdict } from "./assessment";

export class ReadingBandCalculator {
  static readonly version = "reading-academic-practice-v1";

  private readonly thresholds: readonly (readonly [number, number])[] = [
    [39, 9],
    [37, 8.5],
    [35, 8],
    [33, 7.5],
    [30, 7],
    [27, 6.5],
    [23, 6],
    [20, 5.5],
    [16, 5],
    [13, 4.5],
    [10, 4],
    [7, 3.5],
    [5, 3],
    [3, 2.5],
    [2, 2],
    [0, 1],
  ];

  calculate(
    verdicts: readonly Pick<ReadingVerdict, "earned" | "possible">[],
  ): number | null {
    if (
      !verdicts.length ||
      verdicts.some(
        ({ earned, possible }) =>
          !Number.isSafeInteger(earned) ||
          !Number.isSafeInteger(possible) ||
          possible < 1 ||
          earned < 0 ||
          earned > possible,
      )
    )
      return null;

    const earned = verdicts.reduce((sum, verdict) => sum + verdict.earned, 0);
    const possible = verdicts.reduce(
      (sum, verdict) => sum + verdict.possible,
      0,
    );
    const projectedMarks = Math.round((earned / possible) * 40);
    return this.thresholds.find(([minimum]) => projectedMarks >= minimum)![1];
  }
}
