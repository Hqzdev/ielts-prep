"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import {
  ArrowRight,
  Check,
  ClockCounterClockwise,
  Play,
} from "@phosphor-icons/react";
import type { LearningService, StudySession } from "@/server/services/learning";
import type { Attempt } from "@/domain/attempt";
import type { Profile } from "@/domain/profile";
import { currentOverallBand } from "@/domain/statistics";
import { api } from "@/client/api";
import { errorMessage } from "@/domain/errors";
import { DailyStreakCard } from "./daily-streak";
import { OrbitProgress, SkillBadge, type OrbitSkill } from "./orbit-ui";

type DashboardData = Awaited<ReturnType<LearningService["dashboard"]>>;

function daysUntil(examDate: string | null, today: string) {
  if (!examDate) return null;
  const milliseconds =
    Date.parse(`${examDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`);
  return Math.max(0, Math.ceil(milliseconds / 86_400_000));
}

function SessionRow({ session }: { session: StudySession }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const attempt = await api<Attempt>(`/api/learning/${session.id}`, {
        method: "POST",
        body: "{}",
      });
      router.push(
        ["submitted", "completed"].includes(attempt.status)
          ? `/results/${attempt.id}`
          : `/practice/${attempt.id}`,
      );
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
    }
  }

  return (
    <div className="orbit-plan-row">
      <SkillBadge skill={session.task.skill as OrbitSkill} compact />
      <div>
        <strong>{session.task.title}</strong>
        <span>
          {session.task.skill[0].toUpperCase() + session.task.skill.slice(1)} ·{" "}
          {session.plannedMinutes} min
        </span>
        {error && <span className="orbit-inline-error">{error}</span>}
      </div>
      {session.status === "completed" ? (
        <span className="orbit-done" aria-label="Completed">
          <Check size={17} weight="bold" />
        </span>
      ) : (
        <button
          className="orbit-round-action"
          type="button"
          onClick={start}
          disabled={busy}
          aria-label={`${session.status === "started" ? "Continue" : "Start"} ${session.task.title}`}
        >
          <Play size={16} weight="fill" />
        </button>
      )}
    </div>
  );
}

export function Dashboard({
  data,
  profile,
}: {
  data: DashboardData;
  profile: Profile;
}) {
  const todaySessions = data.sessions.filter(
    (session) => session.scheduledDate === data.today,
  );
  const completed = todaySessions.filter(
    (session) => session.status === "completed",
  ).length;
  const currentBand = currentOverallBand(
    data.statistics,
    profile.selfReportedBand,
  );
  const remainingDays = daysUntil(profile.examDate, data.today);
  const featured = todaySessions.find(
    (session) => session.status !== "completed",
  );
  const progress = 51;

  return (
    <div className="orbit-page orbit-dashboard-page">
      <section className="orbit-exam-card">
        <div className="orbit-exam-copy">
          <h1>
            {remainingDays === null
              ? "Set your exam date"
              : `Exam in ${remainingDays} days`}
          </h1>
          <Link href="/account" className="orbit-text-link">
            {profile.examDate
              ? new Date(`${profile.examDate}T00:00:00`).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric" },
                )
              : "Choose a date"}
          </Link>
        </div>
        <div className="orbit-band-journey">
          <div
            className="orbit-band-track"
            style={
              {
                "--band-position": `${Math.min(88, Math.max(12, progress))}%`,
              } as CSSProperties
            }
          >
            <OrbitProgress value={progress} />
            <div className="orbit-exam-ticks" aria-hidden="true">
              {Array.from({ length: 12 }, (_, index) => (
                <i key={index} />
              ))}
            </div>
            <div className="orbit-exam-end">
              <small>EXAM DATE</small>
              <span>
                {profile.examDate
                  ? new Date(`${profile.examDate}T00:00:00`).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" },
                    )
                  : "Not set"}
              </span>
            </div>
            <div className="orbit-band-current">
              <strong>{currentBand?.toFixed(1) ?? "—"}</strong>
              <i />
              <small>TODAY</small>
            </div>
          </div>
          <div className="orbit-band-value">
            <strong>{profile.targetBand.toFixed(1)}</strong>
            <span>GOAL</span>
          </div>
        </div>
        <p className="orbit-exam-caption">
          {currentBand && currentBand >= profile.targetBand
            ? "On track. Keep your momentum going."
            : "Not on pace yet. Time to speed up."}
        </p>
      </section>

      <section className="orbit-dashboard-board">
        <div className="orbit-today-summary">
          <h2>
            Your plan for
            <br />
            today
          </h2>
          <p>
            {completed}/{todaySessions.length || 0} completed ·{" "}
            {todaySessions.reduce(
              (sum, session) => sum + session.plannedMinutes,
              0,
            )}{" "}
            min
          </p>
          <span className="orbit-kicker">VEY&apos;S PICK</span>
          <strong>
            {featured?.task.skill === "writing"
              ? "Essay focus"
              : "Build momentum"}
          </strong>
        </div>

        <div className="orbit-plan-list">
          <div className="orbit-mini-notice">
            <span>DAILY PLAN</span>
            <strong>
              {todaySessions.length
                ? "Finish one more session"
                : "Choose a practice task"}
            </strong>
            <small>
              {todaySessions.length
                ? "Your next win is close"
                : "Vey will help you get started"}
            </small>
          </div>
          {todaySessions.length ? (
            todaySessions
              .slice(0, 5)
              .map((session) => (
                <SessionRow key={session.id} session={session} />
              ))
          ) : (
            <div className="orbit-plan-empty">
              <div>
                <strong>No sessions planned for today</strong>
                <Link href="/tests/reading">Pick an extra practice</Link>
              </div>
            </div>
          )}
        </div>

        <div className="orbit-focus-deck">
          <article className="orbit-focus-card">
            <div>
              <span className="orbit-kicker">TODAY&apos;S FOCUS</span>
              <h2>{featured?.task.title ?? "Academic Reading"}</h2>
              <p>
                {featured
                  ? `${featured.task.skill[0].toUpperCase() + featured.task.skill.slice(1)} · about ${featured.plannedMinutes} min`
                  : "A quick practice session to keep your streak alive"}
              </p>
              <Link
                className="orbit-button white"
                href={
                  featured
                    ? `/tests/${featured.task.skill}/${featured.task.id}`
                    : "/tests/reading"
                }
              >
                <Play size={17} weight="fill" /> Start
              </Link>
            </div>
          </article>
          <DailyStreakCard />
        </div>
      </section>

      <Link
        href="/statistics?tab=history"
        className="orbit-recent-strip"
        aria-label="View history"
      >
        <div className="orbit-recent-title">
          <ClockCounterClockwise size={20} />
          <div>
            <strong>Test History</strong>
            <span>Every past attempt with answers and mistake review</span>
          </div>
        </div>
        <ArrowRight className="orbit-icon-link" size={32} />
      </Link>
    </div>
  );
}
