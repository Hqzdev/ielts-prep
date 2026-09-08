import type { NativeSkill } from "./native-profile";
import { localDate } from "./planner";

export interface Forecast {
  skill: NativeSkill;
  target: number;
  estimatedDate: string | null;
  reason:
    "insufficient_data" | "no_growth" | "too_distant" | "reached" | "projected";
  resultCount: number;
}

export class NativeForecast {
  calculate(
    skill: NativeSkill,
    target: number,
    samples: { date: string; band: number; format: string }[],
    now: Date,
    timezone = "UTC",
  ): Forecast {
    const recent = samples
      .filter(
        (sample) =>
          Number.isFinite(sample.band) &&
          Date.parse(sample.date) >= now.getTime() - 90 * 86400000 &&
          Date.parse(sample.date) <= now.getTime(),
      )
      .sort((a, b) => a.date.localeCompare(b.date));
    const format = recent.at(-1)?.format;
    const days = new Map<string, number>();
    for (const sample of recent
      .filter((sample) => sample.format === format)
      .sort((a, b) => a.date.localeCompare(b.date)))
      days.set(localDate(timezone, new Date(sample.date)), sample.band);
    const points = [...days].map(([day, band]) => ({
      day: Date.parse(day) / 86400000,
      band,
    }));
    const result: Forecast = {
      skill,
      target,
      estimatedDate: null,
      reason: "insufficient_data",
      resultCount: points.length,
    };
    if (!points.length) return result;
    if (points.at(-1)!.band >= target) return { ...result, reason: "reached" };
    if (points.length < 3 || points.at(-1)!.day - points[0].day < 7)
      return result;
    const meanDay = points.reduce((sum, p) => sum + p.day, 0) / points.length;
    const meanBand = points.reduce((sum, p) => sum + p.band, 0) / points.length;
    const slope =
      points.reduce(
        (sum, p) => sum + (p.day - meanDay) * (p.band - meanBand),
        0,
      ) / points.reduce((sum, p) => sum + (p.day - meanDay) ** 2, 0);
    if (slope <= 0) return { ...result, reason: "no_growth" };
    const day = meanDay + (target - meanBand) / slope;
    if (day <= now.getTime() / 86400000)
      return { ...result, reason: "no_growth" };
    if (day - now.getTime() / 86400000 > 365)
      return { ...result, reason: "too_distant" };
    return {
      ...result,
      reason: "projected",
      estimatedDate: new Date(day * 86400000).toISOString().slice(0, 10),
    };
  }
}
