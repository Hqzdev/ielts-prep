"use client";
import Link from "next/link";
import { CatalogBackLink } from "./catalog-back-link";
import { WordComposer } from "./word-composer";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Play,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import type { Attempt } from "@/domain/attempt";
import { formatDuration, wordCount } from "@/domain/attempt";
import { categoryLabels, type Assessment } from "@/domain/assessment";
import { taskPartLabel } from "@/domain/task";
import { api } from "@/client/api";
import { errorMessage } from "@/domain/errors";
import { Button, ErrorNotice, EmptyState } from "./ui";

export function AudioPlayback({
  id,
  start = 0,
  label = "Play recording",
}: {
  id: string;
  start?: number;
  label?: string;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  async function play() {
    try {
      const response = await api<{ url: string }>(`/api/audio/${id}`);
      setUrl(response.url);
      setError(null);
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  return (
    <div>
      <button className="button ghost compact" onClick={play}>
        <Play size={14} />
        {label}
        {start > 0 ? ` · ${formatDuration(start)}` : ""}
      </button>
      {url && (
        <audio
          ref={audio}
          controls
          src={url}
          onLoadedMetadata={() => {
            if (audio.current) {
              audio.current.currentTime = start;
              void audio.current.play().catch(() => {});
            }
          }}
        />
      )}
      <ErrorNotice message={error} />
    </div>
  );
}

export function Result({
  initialAttempt,
  initialAssessment,
  parentAssessment,
}: {
  initialAttempt: Attempt;
  initialAssessment: Assessment | null;
  parentAssessment: Assessment | null;
}) {
  const [assessment, setAssessment] = useState(initialAssessment);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCorrect, setShowCorrect] = useState(false);
  const router = useRouter();
  const attempt = initialAttempt;
  const task = attempt.taskSnapshot;
  const status = assessment?.status ?? "unavailable";
  useEffect(() => {
    if (!["queued", "processing"].includes(status)) return;
    const poll = setInterval(() => {
      void api<{ assessment: Assessment }>(`/api/attempts/${attempt.id}/result`)
        .then((result) => setAssessment(result.assessment))
        .catch((error) => setError(errorMessage(error)));
    }, 2500);
    return () => clearInterval(poll);
  }, [attempt.id, status]);
  async function revise() {
    setBusy(true);
    try {
      const revision = await api<Attempt>(
        `/api/attempts/${attempt.id}/revisions`,
        { method: "POST", body: "{}" },
      );
      router.push(`/practice/${revision.id}`);
    } catch (error) {
      setError(errorMessage(error));
      setBusy(false);
    }
  }
  async function retry() {
    setBusy(true);
    setError(null);
    try {
      setAssessment(
        await api<Assessment>(`/api/attempts/${attempt.id}/retry-assessment`, {
          method: "POST",
          body: "{}",
        }),
      );
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  const reading = assessment?.reading ?? [];
  const earned = reading.reduce((sum, r) => sum + r.earned, 0);
  const possible = reading.reduce((sum, r) => sum + r.possible, 0);
  const percent = possible ? (earned / possible) * 100 : 0;
  const errors = reading.filter((r) => !r.correct);
  const grade = assessment?.grade;
  return (
    <div className="page result-page" data-skill={task.skill}>
      <div className="breadcrumb">
        <CatalogBackLink skill={task.skill}>Tests</CatalogBackLink>
        <span>/</span>
        <span>{task.skill[0].toUpperCase() + task.skill.slice(1)}</span>
        <span>/</span>
        <span>Result</span>
      </div>
      <div className="result-heading">
        <div>
          <h1>Your result</h1>
          <p className="small muted" style={{ margin: "12px 0 0" }}>
            {task.title} · {taskPartLabel(task)}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span className="tag">
            {attempt.mode === "strict" ? "Strict mode" : "Practice"}
          </span>
          <p className="small muted" style={{ margin: "10px 0 0" }}>
            <Clock3
              size={14}
              style={{
                display: "inline",
                verticalAlign: "middle",
                marginRight: 5,
              }}
            />
            {formatDuration(attempt.elapsedSeconds)}
            {task.skill === "writing"
              ? ` · ${wordCount(attempt.answer.text)} words`
              : ""}
            {attempt.mode === "practice" &&
            attempt.elapsedSeconds > task.durationSeconds
              ? ` · overtime ${formatDuration(attempt.elapsedSeconds - task.durationSeconds)}`
              : ""}
          </p>
        </div>
      </div>
      <ErrorNotice message={error} />
      {status === "ready" && (
        <>
          <section className="result-overview">
            <div>
              <div className="band-number">
                {assessment?.band?.toFixed(1) ?? "—"}
                <span> / 9</span>
              </div>
              <div className="band-label">
                {task.skill === "reading"
                  ? "Estimated band · Reading"
                  : `Practice band · ${taskPartLabel(task)}`}
              </div>
              <p className="small muted" style={{ marginTop: 12 }}>
                {task.skill === "reading"
                  ? `${earned} / ${possible} marks · ${percent.toLocaleString("en-GB", { maximumFractionDigits: 1 })}% correct`
                  : "Estimated score for this exercise"}
              </p>
              {parentAssessment?.band !== null &&
                parentAssessment?.band !== undefined &&
                assessment?.band !== null && (
                  <p className="small link">
                    Before: {parentAssessment.band.toFixed(1)} → after:{" "}
                    {assessment?.band?.toFixed(1)}
                  </p>
                )}
            </div>
            {task.skill === "reading" ? (
              <div>
                <h2>Let&apos;s review your answers</h2>
                <p className="muted">
                  {errors.length
                    ? `Questions with mistakes: ${errors.length}. See the correct answers and supporting evidence below.`
                    : "All answers are correct. Try another exercise to build on this result."}
                </p>
                <p className="small muted">
                  Your accuracy is projected to 40 marks using an Academic
                  Reading conversion table. This is a practice estimate; a full
                  exam score may differ.
                </p>
              </div>
            ) : (
              <div className="criteria-grid">
                {grade?.criteria.map((criterion) => (
                  <div key={criterion.key}>
                    <span className="criterion-name">{criterion.label}</span>
                    <strong className="criterion-score">
                      {criterion.score.toFixed(1)}
                    </strong>
                    <details className="criterion-explanation">
                      <summary>Details</summary>
                      <p>{criterion.explanation}</p>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="section">
            <div className="spread section-title">
              <h2 style={{ margin: 0 }}>Mistakes and corrections</h2>
              <span className="small muted">
                {task.skill === "reading"
                  ? errors.length
                  : (grade?.errors.length ?? 0)}{" "}
                feedback items
              </span>
            </div>
            {task.skill === "reading"
              ? errors.map((verdict, index) => (
                  <article className="feedback-row" key={verdict.number}>
                    <span className="feedback-index">{index + 1}</span>
                    <div>
                      <span className="tag">Question {verdict.number}</span>
                      <h3>{verdict.statement}</h3>
                      <div className="correction-grid">
                        <div>
                          <p className="eyebrow">Your answer</p>
                          <div className="quote-block">
                            {verdict.given.join(", ") || "No answer"}
                          </div>
                        </div>
                        <div>
                          <p className="eyebrow">Correct answer</p>
                          <div className="quote-block corrected">
                            {verdict.expected.join(", ")}
                          </div>
                        </div>
                      </div>
                      <p className="feedback-explanation">
                        {verdict.explanation}
                      </p>
                      <details style={{ marginTop: 14 }}>
                        <summary className="small link">
                          Evidence · paragraph {verdict.paragraph}
                        </summary>
                        <blockquote
                          className="quote-block"
                          style={{ margin: "12px 0 0" }}
                        >
                          {verdict.evidence}
                        </blockquote>
                      </details>
                    </div>
                  </article>
                ))
              : grade?.errors.map((feedback, index) => (
                  <article
                    className="feedback-row writing-feedback"
                    key={index}
                  >
                    <div>
                      <p className="feedback-category">
                        {String(index + 1).padStart(2, "0")} ·{" "}
                        {categoryLabels[feedback.category]}
                      </p>
                      <div className="correction-grid">
                        <div>
                          <p className="eyebrow">
                            {feedback.anchor.type === "requirement"
                              ? "Task requirement"
                              : "Your answer"}
                          </p>
                          <div className="quote-block">
                            {feedback.anchor.type === "requirement"
                              ? feedback.anchor.requirement
                              : feedback.anchor.quote}
                          </div>
                          {feedback.anchor.type === "audio" && (
                            <AudioPlayback
                              id={feedback.anchor.audioId}
                              start={feedback.anchor.startSeconds}
                            />
                          )}
                        </div>
                        <div>
                          <p className="eyebrow">How to improve it</p>
                          <div className="quote-block corrected">
                            {feedback.correction}
                          </div>
                          <p className="feedback-explanation">
                            {feedback.issue}
                          </p>
                        </div>
                        <ArrowRight
                          className="correction-direction"
                          size={22}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </article>
                ))}
            {task.skill === "reading" && (
              <>
                <button
                  className="button ghost"
                  onClick={() => setShowCorrect(!showCorrect)}
                >
                  {showCorrect ? "Hide" : "Show"} correct answers (
                  {reading.length - errors.length}) <ChevronRight size={16} />
                </button>
                {showCorrect &&
                  reading
                    .filter((r) => r.correct)
                    .map((verdict) => (
                      <div key={verdict.number} className="correct-reading">
                        <Check size={17} />
                        <span>
                          Question {verdict.number} · {verdict.given.join(", ")}
                        </span>
                      </div>
                    ))}
              </>
            )}
            {task.skill !== "reading" && grade?.strengths.length ? (
              <div className="section">
                <h3>What went well</h3>
                {grade.strengths.map((strength) => (
                  <p key={strength} className="row small">
                    <Check size={17} color="var(--success)" />
                    {strength}
                  </p>
                ))}
              </div>
            ) : null}
            {grade?.fulfilledRequirements.length ? (
              <div className="section">
                <h2>Cue card coverage</h2>
                {grade.fulfilledRequirements.map((requirement) => (
                  <div className="session-row" key={requirement.requirement}>
                    <span className="tag">
                      {requirement.fulfilled ? "Covered" : "Needs more detail"}
                    </span>
                    <div className="session-main">
                      <strong className="small">
                        {requirement.requirement}
                      </strong>
                      <p>{requirement.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
          {grade?.nextFocus && (
            <div className="result-focus">
              <span className="eyebrow">Next step</span>
              <h3 style={{ marginTop: 10, marginBottom: 0 }}>
                {grade.nextFocus}
              </h3>
            </div>
          )}
        </>
      )}
      {status !== "ready" && (
        <EmptyState
          title={
            status === "queued"
              ? "Your answer is in the queue"
              : status === "processing"
                ? "Reviewing your work"
                : status === "failed"
                  ? "Assessment could not be completed"
                  : status === "insufficient_evidence"
                    ? "Not enough evidence"
                    : "Answer saved"
          }
          action={
            ["unavailable", "failed"].includes(status) ? (
              <Button variant="secondary" onClick={retry} busy={busy}>
                <RotateCcw size={16} />{" "}
                {status === "failed"
                  ? "Retry assessment"
                  : "Check AI availability"}
              </Button>
            ) : undefined
          }
        >
          {status === "queued" || status === "processing"
            ? "You can close this page. Your result will be saved in your history."
            : status === "insufficient_evidence"
              ? (grade?.insufficientReason ??
                "The recording does not contain enough material for a reliable assessment.")
              : status === "failed"
                ? "Your work is safe. Try again — a new result will not replace your original answer."
                : assessment?.errorCode === "DAILY_LIMIT"
                  ? "Your work is saved. You have reached today's AI assessment limit. You can request a review tomorrow."
                  : assessment?.errorCode === "ASSESSMENT_ACTIVE"
                    ? "Your work is saved. You can request a review once your current assessment finishes."
                    : "AI assessment will be available once it is connected and configured. For now, you can return to your work and revise it yourself."}
        </EmptyState>
      )}
      {assessment?.transcripts.length ? (
        <section className="section">
          <h2>Your transcript</h2>
          {assessment.transcripts.map((transcript, index) => (
            <div
              className="panel"
              key={transcript.audioId}
              style={{ marginBottom: 16 }}
            >
              <p className="eyebrow">Answer {index + 1}</p>
              <AudioPlayback id={transcript.audioId} />
              <p className="transcript" style={{ marginTop: 15 }}>
                {transcript.text}
              </p>
              <div className="row" style={{ flexWrap: "wrap" }}>
                {transcript.segments.map((segment, i) => (
                  <AudioPlayback
                    key={i}
                    id={transcript.audioId}
                    start={segment.startSeconds}
                    label="Segment"
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : (
        task.skill === "speaking" && (
          <section className="section">
            <h2>Your recordings</h2>
            {attempt.answer.audioIds.map((id, index) => (
              <AudioPlayback key={id} id={id} label={`Answer ${index + 1}`} />
            ))}
          </section>
        )
      )}
      {task.skill === "writing" && (
        <details className="section">
          <summary className="small link">View original answer</summary>
          <p className="original-answer" style={{ marginTop: 16 }}>
            {attempt.answer.text || "No answer was saved before time ran out."}
          </p>
        </details>
      )}
      <div className="result-footer">
        <WordComposer topic={task.topic} captureSelection />
        <Link className="button secondary" href={`/ai?attempt=${attempt.id}`}>
          <Sparkles size={17} /> Discuss with AI
        </Link>
        <Button busy={busy} onClick={revise}>
          {task.skill === "writing" ? "Revise answer" : "Try task again"}
          <ArrowRight size={17} />
        </Button>
      </div>
      <p className="small muted" style={{ marginTop: 16, textAlign: "right" }}>
        Your previous attempt will stay in your history.
      </p>
    </div>
  );
}
