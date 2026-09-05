import type { Attempt } from "./attempt";
import type { Assessment } from "./assessment";
import type { Skill } from "./task";

export interface SkillStatistics {
  skill: Skill;
  count: number;
  latest: number | null;
  average: number | null;
  unit: "band";
  series: { date: string; value: number; part: number; mode: string }[];
  criteria: { key: string; label: string; average: number }[];
  formats: {
    format: string;
    correct: number;
    total: number;
    accuracy: number;
  }[];
  errors: { category: string; count: number }[];
}
export interface LearningStatistics {
  skills: SkillStatistics[];
  independentCount: number;
  revisionCount: number;
  totalMinutes: number;
  history: StatisticsHistoryItem[];
  activity: { date: string; count: number }[];
}

export interface StatisticsHistoryItem {
  id: string;
  date: string;
  title: string;
  skill: Skill;
  mode: Attempt["mode"];
  band: number | null;
  accuracy: number | null;
  durationMinutes: number;
}

export function currentOverallBand(
  statistics: Pick<LearningStatistics, "skills">,
  fallback: number | null,
) {
  const values = statistics.skills
    .map((skill) => skill.latest)
    .filter((value): value is number => value !== null);
  if (!values.length) return fallback;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(average * 2) / 2;
}

export class StatisticsCalculator {
  calculate(
    attempts: Attempt[],
    assessments: Assessment[],
  ): LearningStatistics {
    const independent = attempts.filter(
      (a) =>
        !a.parentAttemptId && ["submitted", "completed"].includes(a.status),
    );
    const skills: SkillStatistics[] = (
      ["writing", "speaking", "reading"] as Skill[]
    ).map((skill) => {
      const eligible = independent
        .filter((a) => a.taskSnapshot.skill === skill)
        .map((attempt) => ({
          attempt,
          assessment: assessments.find(
            (a) => a.attemptId === attempt.id && a.status === "ready",
          ),
        }))
        .filter(
          (entry): entry is { attempt: Attempt; assessment: Assessment } =>
            !!entry.assessment,
        );
      const series = eligible
        .map(({ attempt, assessment }) => ({
          date: attempt.submittedAt ?? attempt.createdAt,
          value: assessment.band,
          part: attempt.taskSnapshot.part,
          mode: attempt.mode,
        }))
        .filter(
          (item): item is typeof item & { value: number } =>
            item.value !== null && Number.isFinite(item.value),
        )
        .sort((a, b) => a.date.localeCompare(b.date));
      const criteria = new Map<string, { label: string; scores: number[] }>();
      const formats = new Map<string, { correct: number; total: number }>();
      const categories = new Map<string, number>();
      for (const { attempt, assessment } of eligible) {
        for (const criterion of assessment.grade?.criteria ?? []) {
          const group = criteria.get(criterion.key) ?? {
            label: criterion.label,
            scores: [],
          };
          group.scores.push(criterion.score);
          criteria.set(criterion.key, group);
        }
        for (const error of assessment.grade?.errors ?? [])
          categories.set(
            error.category,
            (categories.get(error.category) ?? 0) + 1,
          );
        if (assessment.reading) {
          const group = formats.get(attempt.taskSnapshot.format) ?? {
            correct: 0,
            total: 0,
          };
          for (const answer of assessment.reading) {
            group.correct += answer.earned;
            group.total += answer.possible;
          }
          formats.set(attempt.taskSnapshot.format, group);
        }
      }
      return {
        skill,
        count: series.length,
        latest: series.at(-1)?.value ?? null,
        average: series.length
          ? series.slice(-5).reduce((n, r) => n + r.value, 0) /
            Math.min(series.length, 5)
          : null,
        unit: "band",
        series,
        criteria: [...criteria].map(([key, group]) => ({
          key,
          label: group.label,
          average:
            group.scores.reduce((a, b) => a + b, 0) / group.scores.length,
        })),
        formats: [...formats].map(([format, group]) => ({
          format,
          ...group,
          accuracy: (group.correct / Math.max(1, group.total)) * 100,
        })),
        errors:
          eligible.length >= 5
            ? [...categories]
                .map(([category, count]) => ({ category, count }))
                .sort((a, b) => b.count - a.count)
            : [],
      };
    });
    return {
      skills,
      independentCount: independent.length,
      revisionCount: attempts.filter(
        (a) =>
          a.parentAttemptId && ["submitted", "completed"].includes(a.status),
      ).length,
      totalMinutes: Math.round(
        attempts.reduce((total, a) => total + a.elapsedSeconds, 0) / 60,
      ),
      history: independent.map((attempt) => {
        const assessment = assessments.find(
          (item) => item.attemptId === attempt.id && item.status === "ready",
        );
        const earned = assessment?.reading?.reduce(
          (sum, verdict) => sum + verdict.earned,
          0,
        );
        const possible = assessment?.reading?.reduce(
          (sum, verdict) => sum + verdict.possible,
          0,
        );
        return {
          id: attempt.id,
          date: attempt.submittedAt ?? attempt.createdAt,
          title: attempt.taskSnapshot.title,
          skill: attempt.taskSnapshot.skill,
          mode: attempt.mode,
          band: assessment?.band ?? null,
          accuracy:
            earned !== undefined && possible
              ? Math.round((earned / possible) * 100)
              : null,
          durationMinutes: Math.max(1, Math.round(attempt.elapsedSeconds / 60)),
        };
      }),
      activity: [...independent.reduce((days, attempt) => {
        const date = (attempt.submittedAt ?? attempt.createdAt).slice(0, 10);
        days.set(date, (days.get(date) ?? 0) + 1);
        return days;
      }, new Map<string, number>())].map(([date, count]) => ({ date, count })),
    };
  }
}
