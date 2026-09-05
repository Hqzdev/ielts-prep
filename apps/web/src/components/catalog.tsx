"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Headphones,
  Microphone,
  PencilLine,
  Play,
  Shuffle,
} from "@phosphor-icons/react";
import type { CatalogItem } from "@veylo/backend/application/ports/practice";
import type { Skill } from "@veylo/backend/domain/task";
import { StartTask } from "./start-task";
import { PageHeading } from "./orbit-ui";

const skillTabs = [
  { key: "reading", label: "Reading", Icon: BookOpen },
  { key: "listening", label: "Listening", Icon: Headphones },
  { key: "writing", label: "Writing", Icon: PencilLine },
  { key: "speaking", label: "Speaking", Icon: Microphone },
] as const;

export function Catalog({
  items,
  skill,
}: {
  items: CatalogItem[];
  skill: Skill;
}) {
  const params = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const perPage = 15;
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const sorted = [...items].sort(
    (left, right) =>
      Number(left.status === "completed") -
        Number(right.status === "completed") ||
      left.task.id.localeCompare(right.task.id),
  );
  const shown = sorted.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );
  const random = sorted.find((item) => item.status === "new") ?? sorted[0];
  const fullExam = sorted[0];

  return (
    <div className="orbit-page orbit-catalog-page">
      <PageHeading
        title="IELTS Mock Tests"
        subtitle="Pick a test type & start practicing!"
      />
      {fullExam && (
        <section className="orbit-full-exam">
          <span>
            <Play size={28} weight="fill" />
          </span>
          <div>
            <h2>Full Exam</h2>
            <p>
              Start with a timed practice test and get detailed feedback on your
              answers.
            </p>
          </div>
          <StartTask
            task={fullExam.task}
            attemptId={
              fullExam.status === "started" ? fullExam.lastAttemptId : null
            }
          />
        </section>
      )}

      <nav className="orbit-catalog-tabs" aria-label="Test skills">
        {skillTabs.map(({ key, label, Icon }) => {
          const disabled = key === "listening";
          const count = key === skill ? items.length : null;
          return disabled ? (
            <span key={key} className="disabled">
              <Icon size={19} weight="bold" /> {label}
              <b>0</b>
            </span>
          ) : (
            <Link
              key={key}
              href={`/tests/${key}`}
              className={skill === key ? "active" : ""}
            >
              <Icon size={19} weight={skill === key ? "fill" : "bold"} />{" "}
              {label}
              {count !== null && <b>{count}</b>}
            </Link>
          );
        })}
      </nav>

      <section className="orbit-test-catalog">
        <div className="orbit-catalog-title">
          <div>
            <h2>Academic {skill[0].toUpperCase() + skill.slice(1)} Tests</h2>
            <p>
              {items.length} tests ·{" "}
              {items.filter((item) => item.status === "completed").length}{" "}
              completed
            </p>
          </div>
        </div>
        {random && (
          <article className="orbit-random-test">
            <span>
              <Shuffle size={27} weight="bold" />
            </span>
            <div>
              <h3>Random Test</h3>
              <p>
                Unfinished tests first, then your oldest completed practice.
              </p>
            </div>
            <StartTask
              task={random.task}
              attemptId={
                random.status === "started" ? random.lastAttemptId : null
              }
            />
          </article>
        )}
        <div className="orbit-test-grid">
          {shown.map((item) => (
            <article
              key={item.task.id}
              className={item.status === "completed" ? "completed" : ""}
            >
              <div>
                <span className={`orbit-test-icon ${skill}`}>
                  {skill === "reading" ? (
                    <BookOpen size={19} weight="bold" />
                  ) : skill === "writing" ? (
                    <PencilLine size={19} weight="bold" />
                  ) : (
                    <Microphone size={19} weight="bold" />
                  )}
                </span>
                <span>
                  <strong>{item.task.title}</strong>
                  <small>
                    Academic · {Math.ceil(item.task.durationSeconds / 60)} min
                  </small>
                </span>
                <StartTask
                  task={item.task}
                  attemptId={
                    item.status === "started" ? item.lastAttemptId : null
                  }
                  compact
                />
              </div>
              <p>
                {item.status === "completed"
                  ? `Completed${item.lastBand ? ` · Band ${item.lastBand.toFixed(1)}` : ""}`
                  : "Start test"}
              </p>
            </article>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="orbit-pagination">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (number) => (
                <Link
                  key={number}
                  href={`?page=${number}`}
                  aria-current={number === currentPage ? "page" : undefined}
                >
                  {number}
                </Link>
              ),
            )}
            {currentPage < totalPages && (
              <Link href={`?page=${currentPage + 1}`} aria-label="Next page">
                <ArrowRight size={18} weight="bold" />
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
