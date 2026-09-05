"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ChartLineUp,
  ClockCounterClockwise,
  GridFour,
  Lock,
  Target,
  Translate,
  CaretDown,
} from "@phosphor-icons/react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  LearningStatistics,
  SkillStatistics,
  StatisticsHistoryItem,
} from "@veylo/backend/domain/statistics";
import type { Profile } from "@veylo/backend/domain/profile";
import { DailyStreakCard } from "./daily-streak";
import {
  OrbitProgress,
  PageHeading,
  SkillBadge,
  type OrbitSkill,
  VeyCharacter,
} from "./orbit-ui";

type StatisticsTab =
  | "overview"
  | "reading"
  | "listening"
  | "writing"
  | "speaking"
  | "vocabulary"
  | "history";

const tabs: { key: StatisticsTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "reading", label: "Reading" },
  { key: "listening", label: "Listening" },
  { key: "writing", label: "Writing" },
  { key: "speaking", label: "Speaking" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "history", label: "History" },
];

function displayDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function displayTime(value: string) {
  return new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function latestOverall(data: LearningStatistics, fallback: number | null) {
  const values = data.skills
    .map((skill) => skill.latest)
    .filter((value): value is number => value !== null);
  if (!values.length) return fallback;
  return (
    Math.round(
      (values.reduce((sum, value) => sum + value, 0) / values.length) * 2,
    ) / 2
  );
}

function StatisticsNavigation({ active }: { active: StatisticsTab }) {
  const params = useSearchParams();
  return (
    <nav className="orbit-stat-tabs" aria-label="Statistics sections">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={`/statistics?tab=${tab.key}&period=${params.get("period") ?? "month"}`}
          className={`${tab.key} ${active === tab.key ? "active" : ""}`}
          aria-current={active === tab.key ? "page" : undefined}
        >
          {tab.key === "overview" ? (
            <GridFour size={17} weight="bold" />
          ) : tab.key === "history" ? (
            <ClockCounterClockwise size={17} weight="bold" />
          ) : tab.key === "vocabulary" ? (
            <Translate size={17} weight="bold" />
          ) : (
            <SkillBadge skill={tab.key as OrbitSkill} compact />
          )}
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function HistoryRow({ item }: { item: StatisticsHistoryItem }) {
  const value = item.band
    ? item.band.toFixed(1)
    : item.accuracy !== null
      ? `${item.accuracy}%`
      : "Saved";
  return (
    <Link className="orbit-history-row" href={`/results/${item.id}`}>
      <SkillBadge skill={item.skill as OrbitSkill} compact />
      <div>
        <strong>{item.skill[0].toUpperCase() + item.skill.slice(1)}</strong>
        <span>{item.title}</span>
        <small>
          {displayTime(item.date)} · {item.durationMinutes} min · {item.mode}
        </small>
      </div>
      <b className={`orbit-score orbit-score-${item.skill}`}>{value}</b>
      <ArrowRight size={17} weight="bold" />
    </Link>
  );
}

function HistoryView({ data }: { data: LearningStatistics }) {
  const [filter, setFilter] = useState<
    "all" | "reading" | "writing" | "speaking"
  >("all");
  const visible = data.history.filter(
    (item) => filter === "all" || item.skill === filter,
  );
  const groups = visible.reduce<Record<string, StatisticsHistoryItem[]>>(
    (result, item) => {
      const key = displayDate(item.date);
      result[key] = [...(result[key] ?? []), item];
      return result;
    },
    {},
  );
  return (
    <section className="orbit-history-view">
      <div className="orbit-history-filters">
        <div>
          {(
            ["all", "reading", "listening", "writing", "speaking"] as const
          ).map((skill) => (
            <button
              key={skill}
              type="button"
              className={filter === skill ? "active" : ""}
              aria-pressed={filter === skill}
              onClick={() => {
                if (skill !== "listening") setFilter(skill);
              }}
              disabled={skill === "listening"}
            >
              {skill === "all" ? (
                <GridFour size={15} />
              ) : (
                <SkillBadge skill={skill} compact />
              )}
              {skill === "all"
                ? "All"
                : skill[0].toUpperCase() + skill.slice(1)}
            </button>
          ))}
        </div>
        <span>
          {visible.length} {visible.length === 1 ? "result" : "results"}
        </span>
      </div>
      {Object.keys(groups).length ? (
        Object.entries(groups).map(([date, items]) => (
          <div className="orbit-history-group" key={date}>
            <div className="orbit-history-date">
              <span>{date}</span>
              <i />
            </div>
            {items.map((item) => (
              <HistoryRow key={item.id} item={item} />
            ))}
          </div>
        ))
      ) : (
        <div className="orbit-empty-card compact">
          <VeyCharacter state="thinking" size={112} />
          <h2>Your history starts here</h2>
          <p>Complete a test and its result will appear in this timeline.</p>
          <Link href="/tests/reading" className="orbit-button">
            Choose a test
          </Link>
        </div>
      )}
    </section>
  );
}

function SkillSummaryCard({ skill }: { skill: SkillStatistics }) {
  return (
    <Link
      href={`/statistics?tab=${skill.skill}`}
      className={`orbit-skill-summary ${skill.skill}`}
    >
      <div>
        <SkillBadge skill={skill.skill as OrbitSkill} compact />
        <span>
          <strong>{skill.skill[0].toUpperCase() + skill.skill.slice(1)}</strong>
          <small>
            {skill.count} {skill.count === 1 ? "test" : "tests"}
          </small>
        </span>
      </div>
      <b>{skill.latest?.toFixed(1) ?? "—"}</b>
      <p>
        {skill.errors[0]
          ? `Focus: ${skill.errors[0].category.replaceAll("_", " ")}`
          : skill.count
            ? "Keep building consistency"
            : "No assessed attempts yet"}
      </p>
    </Link>
  );
}

function ActivityHeatmap({ data }: { data: LearningStatistics }) {
  const values = new Map(data.activity.map((item) => [item.date, item.count]));
  const anchor = data.activity.length
    ? new Date(
        [...data.activity].sort((a, b) => b.date.localeCompare(a.date))[0].date,
      )
    : new Date();
  const cells = Array.from({ length: 56 }, (_, index) => {
    const date = new Date(anchor);
    date.setDate(anchor.getDate() - (55 - index));
    const key = date.toISOString().slice(0, 10);
    return { key, count: values.get(key) ?? 0 };
  });
  return (
    <div
      className="orbit-activity-grid"
      aria-label="Learning activity over eight weeks"
    >
      {cells.map((cell) => (
        <span
          key={cell.key}
          className={`level-${Math.min(4, cell.count)}`}
          title={`${cell.key}: ${cell.count} activities`}
        />
      ))}
    </div>
  );
}

function OverviewView({
  data,
  profile,
}: {
  data: LearningStatistics;
  profile: Profile;
}) {
  const overall = latestOverall(data, profile.selfReportedBand);
  const weakest = [...data.skills]
    .filter((skill) => skill.latest !== null)
    .sort((a, b) => (a.latest ?? 0) - (b.latest ?? 0))[0];
  const chartData = data.skills
    .flatMap((skill) =>
      skill.series.map((point) => ({
        date: displayDate(point.date),
        value: point.value,
        skill: skill.skill,
      })),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className="orbit-overview">
      <section className="orbit-insights-panel">
        <div className="orbit-insight-progress">
          <div>
            <VeyCharacter size={52} />
            <span>
              <strong>Your insights</strong>
              <small>
                {data.independentCount
                  ? `${data.independentCount} results analysed`
                  : "Complete your first test to unlock more"}
              </small>
            </span>
          </div>
          <OrbitProgress value={Math.min(100, data.independentCount * 8)} />
        </div>
        <div className="orbit-insight-row">
          <span className="orbit-insight-icon">
            <ChartLineUp size={20} weight="bold" />
          </span>
          <div>
            <strong>Your starting band</strong>
            <small>
              {profile.selfReportedBand
                ? "From your profile"
                : "Set your current level in Profile"}
            </small>
          </div>
          <b>{profile.selfReportedBand?.toFixed(1) ?? "—"}</b>
        </div>
        <div className="orbit-insight-row">
          <span className="orbit-insight-icon green">
            <Target size={20} weight="bold" />
          </span>
          <div>
            <strong>Your weakest skill</strong>
            <small>
              {weakest ? weakest.skill : "Vey will find it from your results"}
            </small>
          </div>
          <ArrowRight size={18} weight="bold" />
        </div>
        <div className="orbit-insight-row">
          <span className="orbit-insight-icon green">
            <ChartLineUp size={20} />
          </span>
          <div>
            <strong>Your typical mistakes</strong>
            <small>
              {data.independentCount
                ? "Open your latest test feedback"
                : "Complete a test to get detailed feedback"}
            </small>
          </div>
          <Link
            href="/statistics?tab=history"
            aria-label="Review your test history"
          >
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="orbit-insight-row locked">
          <span className="orbit-insight-icon">
            <Lock size={19} weight="bold" />
          </span>
          <div>
            <strong>Personal exam forecast</strong>
            <small>Unlocks after 12 assessed results</small>
          </div>
          <span>{Math.min(12, data.independentCount)}/12</span>
        </div>
        <div className="orbit-insight-row">
          <span className="orbit-insight-icon">
            <Target size={20} />
          </span>
          <div>
            <strong>A plan built on you</strong>
            <small>
              {profile.dailyMinutes} minutes a day · Target band{" "}
              {profile.targetBand.toFixed(1)}
            </small>
          </div>
          <Link href="/" aria-label="Open your study plan">
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="orbit-summary-grid">
        <DailyStreakCard summary />
        <article className="orbit-summary-card band">
          <span className="orbit-kicker">ESTIMATED BAND</span>
          <strong>{overall?.toFixed(1) ?? "—"}</strong>
          <p>
            {data.independentCount
              ? "Based on recent attempts"
              : "Based on your profile"}
          </p>
          <div className="orbit-band-mini-grid">
            {data.skills.map((skill) => (
              <span key={skill.skill}>
                {skill.skill[0].toUpperCase()}{" "}
                <b>{skill.latest?.toFixed(1) ?? "—"}</b>
              </span>
            ))}
            <span>
              L <b>—</b>
            </span>
          </div>
        </article>
        <article className="orbit-summary-card goal">
          <VeyCharacter size={72} />
          <span className="orbit-kicker">YOUR GOAL</span>
          <strong>{profile.targetBand.toFixed(1)}</strong>
          <OrbitProgress
            value={overall ? (overall / profile.targetBand) * 100 : 0}
          />
          <p>
            {overall
              ? `${Math.max(0, profile.targetBand - overall).toFixed(1)} band points to go`
              : "Add your current band in settings"}
          </p>
        </article>
      </section>

      <section className="orbit-skill-grid">
        {data.skills.map((skill) => (
          <SkillSummaryCard key={skill.skill} skill={skill} />
        ))}
        <article className="orbit-skill-summary listening-locked">
          <div>
            <SkillBadge skill="listening" compact />
            <span>
              <strong>Listening</strong>
              <small>Coming soon</small>
            </span>
          </div>
          <Lock size={20} weight="bold" />
          <p>This skill is not available in the current content bank.</p>
        </article>
      </section>

      <section className="orbit-wide-metric">
        <div>
          <SkillBadge skill="vocabulary" compact />
          <span>
            <strong>Vocabulary</strong>
            <small>300 words across 15 topics</small>
          </span>
        </div>
        <strong>Ready</strong>
        <Link href="/vocabulary">
          Review words <ArrowRight size={15} weight="bold" />
        </Link>
      </section>

      <section className="orbit-wide-metric orbit-ai-time">
        <div>
          <VeyCharacter size={44} />
          <span>
            <strong>Time with Vey</strong>
            <small>Your AI study companion</small>
          </span>
        </div>
        <strong>{data.totalMinutes} min</strong>
        <span>Total practice time</span>
      </section>

      <section className="orbit-data-panel">
        <h2>Activity</h2>
        <ActivityHeatmap data={data} />
      </section>

      <section className="orbit-data-panel orbit-trend-panel">
        <h2>Band score trend</h2>
        {chartData.length ? (
          <div className="orbit-chart">
            <ResponsiveContainer>
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 16, bottom: 2, left: -22 }}
              >
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis
                  domain={[1, 9]}
                  ticks={[3, 4, 5, 6, 7, 8, 9]}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Line
                  dataKey="value"
                  stroke="var(--heading)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "var(--heading)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="orbit-chart-empty">
            <VeyCharacter state="thinking" size={94} />
            <span>Your score trend will appear after an assessed test.</span>
          </div>
        )}
      </section>
    </div>
  );
}

function SkillView({ skill }: { skill: SkillStatistics | null }) {
  if (!skill || !skill.count) {
    return (
      <div className="orbit-skill-detail">
        <section className="orbit-empty-card skill-empty">
          <VeyCharacter state="thinking" size={64} />
          <h2>Not enough data</h2>
          <p>Take more tests to get recommendations</p>
          <Link
            className="orbit-button"
            href={skill ? `/tests/${skill.skill}` : "/tests/reading"}
          >
            Take a test <ArrowRight size={16} weight="bold" />
          </Link>
        </section>
        <h3 className="orbit-divider-title">Detailed Analytics</h3>
        {["Score Trend", "Section Accuracy", "Question Types"].map((title) => (
          <details
            open
            className="orbit-data-panel orbit-empty-analytics"
            key={title}
          >
            <summary>
              <CaretDown size={16} />
              {title}
            </summary>
            <div>
              <VeyCharacter state="idle" size={48} />
              <span>No data for this period</span>
            </div>
          </details>
        ))}
      </div>
    );
  }
  const series = skill.series.map((point) => ({
    date: displayDate(point.date),
    value: point.value,
  }));
  return (
    <div className="orbit-skill-detail">
      <section className="orbit-skill-hero">
        <div>
          <SkillBadge skill={skill.skill as OrbitSkill} />
          <span>
            <strong>{skill.latest?.toFixed(1)}</strong>
            <small>Latest band</small>
          </span>
        </div>
        <div>
          <strong>{skill.count}</strong>
          <span>assessed tests</span>
        </div>
        <div>
          <strong>{skill.average?.toFixed(1)}</strong>
          <span>recent average</span>
        </div>
      </section>
      <section className="orbit-data-panel">
        <h2>Band score trend</h2>
        <div className="orbit-chart">
          <ResponsiveContainer>
            <LineChart
              data={series}
              margin={{ top: 10, right: 16, bottom: 2, left: -22 }}
            >
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[1, 9]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                dataKey="value"
                stroke="var(--progress)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--progress)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="orbit-data-panel">
        <h2>Criteria</h2>
        <div className="orbit-criteria-grid">
          {skill.criteria.length ? (
            skill.criteria.map((criterion) => (
              <div key={criterion.key}>
                <span>{criterion.label}</span>
                <strong>{criterion.average.toFixed(1)}</strong>
                <OrbitProgress value={(criterion.average / 9) * 100} />
              </div>
            ))
          ) : (
            <span className="orbit-muted">
              Detailed criteria will appear with your next AI assessment.
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

export function Statistics({
  data,
  profile,
}: {
  data: LearningStatistics;
  profile: Profile;
}) {
  const params = useSearchParams();
  const requested = params.get("tab");
  const active = tabs.some((tab) => tab.key === requested)
    ? (requested as StatisticsTab)
    : "overview";
  const period = params.get("period") ?? "month";
  const skill = useMemo(
    () => data.skills.find((entry) => entry.skill === active) ?? null,
    [active, data.skills],
  );
  return (
    <div className="orbit-page orbit-statistics-page">
      <PageHeading
        title="Statistics"
        subtitle="See how your skills are improving"
        actions={
          active !== "history" ? (
            <div
              className="orbit-period-control"
              aria-label="Statistics period"
            >
              {Object.entries({
                week: "Week",
                month: "Month",
                "3mo": "3 mo",
                "6mo": "6 mo",
                all: "All time",
              }).map(([value, label]) => (
                <Link
                  key={value}
                  href={`/statistics?tab=${active}&period=${value}`}
                  className={period === value ? "active" : ""}
                  aria-current={period === value ? "true" : undefined}
                >
                  {label}
                </Link>
              ))}
            </div>
          ) : undefined
        }
      />
      <StatisticsNavigation active={active} />
      {active === "history" ? (
        <HistoryView data={data} />
      ) : active === "overview" ? (
        <OverviewView data={data} profile={profile} />
      ) : active === "vocabulary" ? (
        <div className="orbit-empty-card compact">
          <Translate size={38} weight="bold" />
          <h2>Vocabulary analytics</h2>
          <p>
            Your review accuracy will appear as you complete vocabulary quizzes.
          </p>
          <Link className="orbit-button" href="/vocabulary">
            Review vocabulary
          </Link>
        </div>
      ) : active === "listening" ? (
        <div className="orbit-empty-card compact">
          <Lock size={38} weight="bold" />
          <h2>Listening is coming soon</h2>
          <p>
            The current Veylo content bank covers Reading, Writing and Speaking.
          </p>
        </div>
      ) : (
        <SkillView skill={skill} />
      )}
    </div>
  );
}
