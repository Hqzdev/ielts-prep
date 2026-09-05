"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Play } from "@phosphor-icons/react";
import { api } from "@/client/api";
import { errorMessage } from "@/domain/errors";
import type { Task } from "@/domain/task";
import type { Attempt, AttemptMode } from "@/domain/attempt";
import { Button, Modal, ErrorNotice } from "./ui";

export function StartTask({
  task,
  attemptId,
  compact = false,
}: {
  task: Task;
  attemptId?: string | null;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AttemptMode>("practice");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  async function start() {
    setBusy(true);
    setError(null);
    try {
      const attempt = await api<Attempt>("/api/attempts", {
        method: "POST",
        body: JSON.stringify({ taskId: task.id, mode }),
      });
      router.push(`/practice/${attempt.id}`);
    } catch (error) {
      setError(errorMessage(error));
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className={compact ? "task-start" : "button"}
        onClick={() =>
          attemptId ? router.push(`/practice/${attemptId}`) : setOpen(true)
        }
        aria-label={`${attemptId ? "Continue" : "Start"}: ${task.title}`}
      >
        <span className={compact ? "start-label" : ""}>
          {attemptId ? "Continue" : "Start"}
        </span>
        {compact ? (
          <Play size={16} weight="fill" />
        ) : (
          <ArrowRight size={17} weight="bold" />
        )}
      </button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Choose your practice mode"
        description={task.title}
      >
        <label className="mode-choice">
          <span className="row">
            <input
              type="radio"
              name={`mode-${task.id}`}
              checked={mode === "practice"}
              onChange={() => setMode("practice")}
            />
            <strong>Practice</strong>
          </span>
          <p>
            Pause, return to your answer and continue after the timer runs out.
          </p>
        </label>
        <label className="mode-choice">
          <span className="row">
            <input
              type="radio"
              name={`mode-${task.id}`}
              checked={mode === "strict"}
              onChange={() => setMode("strict")}
            />
            <strong>
              Strict mode · {Math.ceil(task.durationSeconds / 60)} min
            </strong>
          </span>
          <p>
            No pauses. When time runs out, your last saved answer is submitted.
          </p>
        </label>
        <ErrorNotice message={error} />
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={start} busy={busy}>
            Start task <ArrowRight size={17} weight="bold" />
          </Button>
        </div>
      </Modal>
    </>
  );
}
