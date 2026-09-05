"use client";
import { CatalogBackLink } from "./catalog-back-link";
import {
  useEffect,
  useEffectEvent,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Clock3, Pause, Play, CloudOff } from "lucide-react";
import { DraftSession } from "@/client/draft-session";
import { api, apiData, ApiError } from "@/client/api";
import { formatDuration } from "@veylo/ui-web/domain/formatting";
import {
  AttemptClock,
  wordCount,
  type Attempt,
} from "@veylo/backend/domain/attempt";
import { errorMessage } from "@veylo/backend/domain/errors";
import {
  taskPartLabel,
  formatLabels,
  topicLabels,
} from "@veylo/ui-web/domain/formatting";
import { Button, ErrorNotice, Modal } from "./ui";
import { TaskChart } from "./task-visual";
import { ReadingQuestions } from "./reading-questions";
import { SpeakingPractice } from "./speaking-practice";
import { WordComposer } from "./word-composer";

export function PracticeWorkspace({
  initial,
  aiAvailable,
}: {
  initial: Attempt;
  aiAvailable: boolean;
}) {
  const [session] = useState(() => new DraftSession(initial));
  const state = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getSnapshot,
  );
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { attempt, answer, saveStatus } = state;
  const task = attempt.taskSnapshot;
  const remaining = new AttemptClock().remaining(
    attempt,
    now || Date.parse(attempt.updatedAt),
  );
  const locked =
    attempt.status === "paused" ||
    busy ||
    (attempt.mode === "strict" && remaining <= 0);
  const words = wordCount(answer.text);
  useEffect(() => {
    void session.start();
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      session.stop();
      clearInterval(tick);
    };
  }, [session]);
  async function submit(expired = false) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (!expired) await session.flush();
      await apiData(
        api.POST("/attempts/{id}/submit", {
          params: { path: { id: attempt.id } },
          body: {},
        }),
      );
      router.replace(`/results/${attempt.id}`);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.code === "DEADLINE_EXPIRED") {
        await submit(true);
        return;
      }
      setError(errorMessage(error));
      setBusy(false);
    }
  }
  const onDeadline = useEffectEvent(() => {
    if (!busy) void submit(true);
  });
  useEffect(() => {
    if (now && attempt.mode === "strict" && remaining <= 0) onDeadline();
  }, [now, remaining, attempt.mode]);
  async function pause() {
    try {
      await session.flush(attempt.status === "paused" ? "resume" : "pause");
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  async function saveAndExit() {
    setBusy(true);
    try {
      await session.flush();
      const base = `/tests/${task.skill}`;
      const saved = sessionStorage.getItem(`catalog:${task.skill}`);
      router.push(saved?.startsWith(`${base}?`) ? saved : base);
    } catch (error) {
      setError(errorMessage(error));
      setBusy(false);
    }
  }
  const saveLabels = {
    saved: "All changes saved",
    saving: "Saving…",
    changed: "Unsaved changes",
    offline: "Offline · local backup",
    conflict: "Version conflict",
  };
  return (
    <div className="page practice-page" data-skill={task.skill}>
      <div className="breadcrumb">
        <CatalogBackLink skill={task.skill}>Tests</CatalogBackLink>
        <span>/</span>
        <CatalogBackLink skill={task.skill}>
          {task.skill[0].toUpperCase() + task.skill.slice(1)}
        </CatalogBackLink>
        <span>/</span>
        <span>{taskPartLabel(task)}</span>
      </div>
      <div className="practice-toolbar">
        <div>
          <h1>
            {task.skill === "speaking"
              ? `Speaking · ${taskPartLabel(task)}`
              : task.title}
          </h1>
          <span className="small muted">
            {topicLabels[task.topic] ?? task.topic} ·{" "}
            {formatLabels[task.format]} ·{" "}
            {task.minimumWords ? `${task.minimumWords}+ words · ` : ""}
            {attempt.mode === "strict" ? "Strict mode" : "Practice"}
          </span>
        </div>
        <div className="row">
          <span className={`timer ${remaining < 0 ? "overtime" : ""}`}>
            <Clock3 size={21} />
            {formatDuration(remaining)}
          </span>
          {attempt.mode === "practice" && task.skill !== "speaking" && (
            <button
              className="icon-button"
              onClick={pause}
              aria-label={attempt.status === "paused" ? "Continue" : "Pause"}
            >
              {attempt.status === "paused" ? (
                <Play size={17} />
              ) : (
                <Pause size={17} />
              )}
            </button>
          )}
        </div>
      </div>
      <ErrorNotice message={error || state.error} />
      {state.recovery && (
        <div className="notice spread">
          <span>A newer local backup of your answer was found.</span>
          <div className="row">
            <Button
              variant="secondary"
              onClick={() => void session.discardRecovery()}
            >
              Keep server version
            </Button>
            <Button onClick={() => session.recover()}>Restore</Button>
          </div>
        </div>
      )}
      {saveStatus === "conflict" && (
        <div className="notice spread">
          <span>Choose which answer to continue with.</span>
          <div className="row">
            <Button
              variant="secondary"
              onClick={() => void session.resolveConflict(false)}
            >
              Load server version
            </Button>
            <Button onClick={() => void session.resolveConflict(true)}>
              Keep my answer
            </Button>
          </div>
        </div>
      )}
      {attempt.status === "paused" && task.skill !== "speaking" && (
        <div className="notice spread">
          <span>Practice is paused. The timer has stopped.</span>
          <Button onClick={pause}>Continue</Button>
        </div>
      )}
      {task.skill === "speaking" ? (
        <SpeakingPractice
          attempt={attempt}
          answer={answer}
          onChange={(value) => session.change(value)}
          onFlush={() => session.flush()}
          onSubmit={() => submit()}
          onTogglePause={() =>
            session.flush(attempt.status === "paused" ? "resume" : "pause")
          }
          aiAvailable={aiAvailable}
        />
      ) : (
        <>
          <div
            className={`exercise-layout ${task.skill === "reading" ? "reading-layout" : ""}`}
          >
            <section className="task-pane">
              <span className="eyebrow">
                {task.skill === "reading" ? "Reading passage" : "Task"}
              </span>
              {task.skill === "reading" ? (
                <>
                  <h2>{task.title}</h2>
                  <WordComposer topic={task.topic} captureSelection />
                  {task.paragraphs.map((paragraph) => (
                    <p className="passage-paragraph" key={paragraph.label}>
                      <strong className="paragraph-label">
                        {paragraph.label}
                      </strong>
                      {paragraph.text}
                    </p>
                  ))}
                </>
              ) : (
                <>
                  <p className="task-prompt writing-prompt">{task.prompt}</p>
                  {task.visual && <TaskChart visual={task.visual} />}
                  <p className="instructions">{task.instructions}</p>
                  <div className="notice" style={{ marginTop: 24 }}>
                    Write at least {task.minimumWords} words. Try to leave time
                    to review your answer.
                  </div>
                </>
              )}
            </section>
            {task.skill === "writing" ? (
              <section className="editor-pane">
                <div className="editor-heading">
                  <h2>Your answer</h2>
                  <span className="save-state" role="status">
                    {saveStatus === "saved" ? (
                      <Check size={14} />
                    ) : saveStatus === "offline" ? (
                      <CloudOff size={14} />
                    ) : null}
                    {saveLabels[saveStatus]}
                  </span>
                </div>
                <textarea
                  className="writing-editor"
                  aria-label="Your answer"
                  placeholder="Start writing here…"
                  value={answer.text}
                  onChange={(event) =>
                    session.change({ ...answer, text: event.target.value })
                  }
                  disabled={locked}
                  spellCheck={false}
                  maxLength={40000}
                />
                <div className="editor-footer">
                  <span>
                    {words} words{" "}
                    <span className="muted">/ minimum {task.minimumWords}</span>
                  </span>
                  <span>Write in English</span>
                </div>
              </section>
            ) : (
              <ReadingQuestions
                task={task}
                answer={answer}
                onChange={(value) => session.change(value)}
                disabled={locked}
              />
            )}
          </div>
          <div className="practice-bottom">
            <div>
              <Button variant="ghost" onClick={saveAndExit} busy={busy}>
                Save and exit
              </Button>
              <p
                className="small muted"
                style={{ margin: "4px 0 0", fontSize: 12 }}
              >
                {task.skill === "reading"
                  ? `${Object.values(answer.reading).filter((v) => (Array.isArray(v) ? v.length : !!v.trim())).length} of ${task.readingQuestions.length} answers · ${saveLabels[saveStatus]}`
                  : aiAvailable
                    ? "Submit for a score and detailed feedback."
                    : "Your answer will be saved. AI assessment is not available yet."}
              </p>
            </div>
            <Button
              busy={busy}
              disabled={
                attempt.status === "paused" ||
                (task.skill === "writing" && !answer.text.trim())
              }
              onClick={() => setConfirm(true)}
            >
              {task.skill === "reading" ? "Finish task" : "Submit for review"}
              <ArrowRight size={17} />
            </Button>
          </div>
        </>
      )}
      <Modal
        open={confirm}
        onOpenChange={setConfirm}
        title="Finish this task?"
        description="Your submitted answer will stay in your history. You can create a new attempt to revise it."
      >
        <p className="small muted">
          {task.skill === "writing" && words < task.minimumWords
            ? `You have written ${words} words. This is below the recommended length, but you can still submit it.`
            : "Make sure you are ready to finish."}
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setConfirm(false)}>
            Back to answer
          </Button>
          <Button busy={busy} onClick={() => submit()}>
            Finish
          </Button>
        </div>
      </Modal>
    </div>
  );
}
