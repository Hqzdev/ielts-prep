"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useDailyStreak } from "./daily-streak-provider";
import { StreakFlame } from "./streak-flame";

export function DailyStreakBadge() {
  const streak = useDailyStreak();
  return (
    <Link
      className="streak-nav"
      href="/statistics?tab=overview#daily-streak"
      aria-label={`${streak.current} day streak. ${streak.todayComplete ? "Today completed" : "Practice today to light your flame"}`}
    >
      <StreakFlame size={34} lit={streak.todayComplete} />
      <strong>{streak.current}</strong>
      <span>day streak</span>
    </Link>
  );
}

export function DailyStreakCard({ summary = false }: { summary?: boolean }) {
  const streak = useDailyStreak();
  return (
    <section
      className={`daily-streak${summary ? " daily-streak-summary" : ""}`}
      id="daily-streak"
      aria-label="Daily learning streak"
    >
      <div className="streak-heading">
        <StreakFlame size={summary ? 56 : 64} lit={streak.todayComplete} />
        <div>
          <span className="orbit-kicker">DAILY FLAME</span>
          <h2>
            <b>{streak.current}</b> {streak.current === 1 ? "day" : "days"} in a
            row
          </h2>
        </div>
        <span className="streak-best">
          Best <b>{streak.best}</b>
        </span>
      </div>
      <ol className="streak-week" aria-label="Learning days this week">
        {streak.week.map((day) => (
          <li
            key={day.date}
            data-state={day.state}
            aria-current={day.date === streak.today ? "date" : undefined}
            aria-label={`${day.label}, ${day.date}: ${day.state === "earned" ? "completed" : day.state === "today" ? "practice today" : day.state === "missed" ? "not completed" : "upcoming"}`}
          >
            <span className="streak-day-icon">
              <StreakFlame size={30} lit={day.state === "earned"} />
              {day.state === "earned" && <Check size={11} aria-hidden="true" />}
            </span>
            <span>{day.label}</span>
          </li>
        ))}
      </ol>
      <p className="streak-prompt">
        {streak.todayComplete
          ? "Today is complete. Come back tomorrow to keep your flame glowing."
          : streak.current
            ? "Complete a practice today to keep your streak alive."
            : "One practice a day. Light your first flame today."}
      </p>
      {!streak.todayComplete && (
        <Link className="streak-action" href="/tests/reading">
          Start a practice <ArrowRight size={15} />
        </Link>
      )}
      <details className="streak-rules">
        <summary>What lights a flame?</summary>
        <p>
          Finish a test with answers, a vocabulary quiz or a full Arcade round.
          Three replies to Vey in one conversation during the day also count.
          Each day earns one flame; a missed day resets your current streak.
          Days follow your profile time zone ({streak.timezone}).
        </p>
      </details>
    </section>
  );
}
