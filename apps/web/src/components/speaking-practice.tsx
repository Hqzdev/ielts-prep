"use client";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Mic, Volume2, ArrowRight, Square, RotateCcw } from "lucide-react";
import { VoiceActivity, VoiceRecorder, AudioUploader } from "@/client/voice";
import { DraftStore } from "@/client/draft-store";
import { api, apiData } from "@/client/api";
import { errorMessage } from "@veylo/backend/domain/errors";
import { formatDuration } from "@veylo/ui-web/domain/formatting";
import { type Attempt, type Answer } from "@veylo/backend/domain/attempt";
import { Button, ErrorNotice } from "./ui";

type Phase =
  | "setup"
  | "ready"
  | "question"
  | "preparation"
  | "recording"
  | "uploading"
  | "between"
  | "finished";
export function SpeakingPractice({
  attempt,
  answer,
  onChange,
  onFlush,
  onSubmit,
  onTogglePause,
  aiAvailable,
}: {
  attempt: Attempt;
  answer: Answer;
  onChange: (answer: Answer) => void;
  onFlush: () => Promise<void>;
  onSubmit: () => Promise<void>;
  onTogglePause: () => Promise<void>;
  aiAvailable: boolean;
}) {
  const task = attempt.taskSnapshot;
  const [phase, setPhase] = useState<Phase>(
    answer.audioIds.length >= task.speakingQuestions.length
      ? "finished"
      : answer.audioIds.length
        ? "between"
        : "setup",
  );
  const [index, setIndex] = useState(Math.max(0, answer.audioIds.length - 1));
  const [seconds, setSeconds] = useState(0);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Blob | null>(null);
  const [questionFailed, setQuestionFailed] = useState(false);
  const recorder = useRef<VoiceRecorder | null>(null);
  const vad = useRef<VoiceActivity | null>(null);
  const questionAudio = useRef<HTMLAudioElement | null>(null);
  const started = useRef(0);
  const lastSpeech = useRef(0);
  const hasSpeech = useRef(false);
  const finishing = useRef(false);
  const starting = useRef(false);
  const pausedAt = useRef(0);
  const currentAnswer = useRef(answer);
  currentAnswer.current = answer;
  useEffect(
    () => () => {
      recorder.current?.destroy();
      void vad.current?.destroy();
      questionAudio.current?.pause();
    },
    [],
  );
  useEffect(() => {
    void new DraftStore()
      .recording(`${attempt.userId}:${attempt.id}:${index}`)
      .then((blob) => {
        if (blob) {
          setPending(blob);
          setError(
            "An unuploaded recording was found. You can try uploading it again.",
          );
        }
      });
  }, [attempt.id, attempt.userId, index]);
  async function prepare() {
    setBusy(true);
    setError(null);
    try {
      recorder.current?.destroy();
      await vad.current?.destroy();
      recorder.current = new VoiceRecorder();
      await recorder.current.prepare();
      vad.current = new VoiceActivity((speech) => {
        setActive(speech);
        if (speech) {
          lastSpeech.current = Date.now();
          hasSpeech.current = true;
        }
      });
      await vad.current.prepare();
      await vad.current.start();
      setPhase("ready");
    } catch (error) {
      setError(`Could not set up the microphone: ${errorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  }
  async function playQuestion(questionIndex = index) {
    setError(null);
    setQuestionFailed(false);
    setPhase("question");
    setBusy(true);
    await vad.current?.pause();
    try {
      const { url } = await apiData(
        api.POST("/audio/question", {
          body: { taskId: task.id, questionIndex },
        }),
      );
      const audio = new Audio(url);
      questionAudio.current = audio;
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error("Could not play the question"));
        void audio.play().catch(reject);
      });
      await afterQuestion(questionIndex);
    } catch (error) {
      setError(
        `${errorMessage(error)}. You can read the question and record your answer.`,
      );
      setQuestionFailed(true);
    } finally {
      setBusy(false);
    }
  }
  async function afterQuestion(questionIndex = index) {
    if (task.part === 2 && questionIndex === 0) {
      started.current = Date.now();
      setSeconds(60);
      setPhase("preparation");
    } else await beginRecording();
  }
  async function beginRecording() {
    if (starting.current) return;
    starting.current = true;
    setError(null);
    setQuestionFailed(false);
    try {
      if (!recorder.current) {
        await prepare();
      }
      await vad.current?.start();
      recorder.current!.start();
      started.current = Date.now();
      lastSpeech.current = Date.now();
      hasSpeech.current = false;
      finishing.current = false;
      setSeconds(0);
      setPhase("recording");
    } catch (error) {
      setError(errorMessage(error));
      setPhase("ready");
    } finally {
      starting.current = false;
    }
  }
  async function upload(blob: Blob) {
    setPhase("uploading");
    setBusy(true);
    try {
      const result = await new AudioUploader().upload(
        attempt.userId,
        attempt.id,
        index,
        blob,
      );
      const audioIds = [...currentAnswer.current.audioIds];
      audioIds[index] = result.id;
      onChange({
        ...currentAnswer.current,
        audioIds: audioIds.filter(Boolean),
      });
      await onFlush();
      setPending(null);
      setPhase(
        index >= task.speakingQuestions.length - 1 ? "finished" : "between",
      );
    } catch (error) {
      setError(`${errorMessage(error)}. The recording is saved locally.`);
      setPending(blob);
      setPhase("between");
    } finally {
      setBusy(false);
    }
  }
  async function finish() {
    if (finishing.current) return;
    finishing.current = true;
    setPhase("uploading");
    try {
      await vad.current?.pause();
      const blob = await recorder.current!.stop();
      await upload(blob);
    } catch (error) {
      setError(errorMessage(error));
      setPhase("ready");
    } finally {
      finishing.current = false;
    }
  }
  const onTimer = useEffectEvent(() => {
    const elapsed = Math.floor((Date.now() - started.current) / 1000);
    if (phase === "preparation") {
      setSeconds(Math.max(0, 60 - elapsed));
      if (elapsed >= 60) void beginRecording();
    } else {
      setSeconds(elapsed);
      if (
        task.part === 2 && index === 0
          ? elapsed >= 120
          : (hasSpeech.current && Date.now() - lastSpeech.current >= 4000) ||
            elapsed >= 120
      )
        void finish();
    }
  });
  useEffect(() => {
    if (
      attempt.status === "paused" ||
      (phase !== "recording" && phase !== "preparation")
    )
      return;
    const timer = setInterval(onTimer, 250);
    return () => clearInterval(timer);
  }, [phase, attempt.status]);
  async function togglePause() {
    setBusy(true);
    setError(null);
    try {
      const resuming = attempt.status === "paused";
      await onTogglePause();
      if (resuming) {
        if (pausedAt.current) {
          const duration = Date.now() - pausedAt.current;
          started.current += duration;
          lastSpeech.current += duration;
        }
        recorder.current?.resume();
        if (phase === "recording" || phase === "ready")
          await vad.current?.start();
        if (phase === "question" && questionAudio.current)
          await questionAudio.current.play();
      } else {
        pausedAt.current = Date.now();
        recorder.current?.pause();
        await vad.current?.pause();
        questionAudio.current?.pause();
      }
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function next() {
    const nextIndex = index + 1;
    setIndex(nextIndex);
    await playQuestion(nextIndex);
  }
  if (attempt.status === "paused")
    return (
      <div className="recording-panel">
        <h2>Speaking is paused</h2>
        <p className="muted">Recording and the timer have stopped.</p>
        <ErrorNotice message={error} />
        <Button onClick={togglePause} busy={busy}>
          Resume Speaking
        </Button>
      </div>
    );
  return (
    <div className="recording-panel">
      <div className="spread">
        <span className="eyebrow">
          {task.part === 2 && index === 0
            ? "Cue card"
            : `Question ${index + 1} of ${task.speakingQuestions.length}`}
        </span>
        <span className="tag">
          {task.part === 2 ? "Part 2" : "Spoken answer"}
        </span>
      </div>
      {attempt.mode === "practice" && phase !== "uploading" && (
        <div style={{ textAlign: "right", marginTop: 12 }}>
          <Button variant="secondary" onClick={togglePause} busy={busy}>
            Pause
          </Button>
        </div>
      )}
      <div className="cue-card">
        <p>{task.speakingQuestions[index]}</p>
        {task.part === 2 && index === 0 && (
          <>
            <span className="small muted">You should say:</span>
            <ul>
              {task.cuePoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </>
        )}
      </div>
      <ErrorNotice message={error} />
      {phase === "setup" && (
        <>
          <div className="voice-orb">
            <Mic size={35} />
          </div>
          <h2>Let&apos;s check your microphone</h2>
          <p className="small muted">
            Allow microphone access. You will hear the examiner&apos;s questions
            and answer aloud.
          </p>
          <Button onClick={prepare} busy={busy}>
            <Mic size={17} /> Connect microphone
          </Button>
        </>
      )}
      {phase === "ready" && (
        <>
          <div className={`voice-orb ${active ? "speaking" : ""}`}>
            <Mic size={35} />
          </div>
          <p className="small muted">
            {active
              ? "Your speech is being detected"
              : "Say a few words to check"}
          </p>
          <Button onClick={() => playQuestion()} busy={busy}>
            <Volume2 size={18} /> Play question
          </Button>
        </>
      )}
      {phase === "question" && (
        <>
          <p className="muted small">
            {busy
              ? "The examiner is asking a question…"
              : "The question is shown above"}
          </p>
          {questionFailed && (
            <Button onClick={() => afterQuestion()}>
              I&apos;ve read the question — continue <ArrowRight size={17} />
            </Button>
          )}
        </>
      )}
      {phase === "preparation" && (
        <>
          <span className="eyebrow">Preparation time</span>
          <div className="record-timer">{formatDuration(seconds)}</div>
          <p className="muted small">
            Plan the structure of your answer. You will have up to two minutes
            to speak.
          </p>
          <Button onClick={beginRecording}>
            I&apos;m ready to answer <Mic size={17} />
          </Button>
        </>
      )}
      {phase === "recording" && (
        <>
          <div className={`voice-orb ${active ? "speaking" : ""}`}>
            <Mic size={35} />
          </div>
          <div className="record-timer">
            {formatDuration(
              task.part === 2 && index === 0 ? 120 - seconds : seconds,
            )}
          </div>
          <p className="small muted">
            {active ? "Recording · speech detected" : "Recording"}
            {task.part !== 2
              ? " · 4 seconds of silence will end your answer"
              : ""}
          </p>
          <Button onClick={finish} disabled={seconds < 1}>
            <Square size={16} /> I&apos;ve finished my answer
          </Button>
        </>
      )}
      {phase === "uploading" && (
        <Button busy disabled>
          Saving recording
        </Button>
      )}
      {pending && (
        <div style={{ marginTop: 20 }}>
          <Button onClick={() => upload(pending)} busy={busy}>
            Retry upload
          </Button>
        </div>
      )}
      {(phase === "between" || phase === "finished") && !pending && (
        <div className="stack">
          <p className="small muted">
            Answers recorded: {answer.audioIds.length} of{" "}
            {task.speakingQuestions.length}
          </p>
          <div className="row" style={{ justifyContent: "center" }}>
            {attempt.mode === "practice" && (
              <Button variant="secondary" onClick={() => playQuestion()}>
                <RotateCcw size={16} /> Record again
              </Button>
            )}
            {phase === "between" ? (
              <Button onClick={next}>
                Next question <ArrowRight size={17} />
              </Button>
            ) : (
              <Button onClick={onSubmit}>
                Finish Speaking <ArrowRight size={17} />
              </Button>
            )}
          </div>
        </div>
      )}
      {!aiAvailable && (
        <p className="small muted" style={{ marginTop: 30 }}>
          Recordings stay in your account for 30 days. AI feedback is not
          available yet.
        </p>
      )}
    </div>
  );
}
