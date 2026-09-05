"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, Mic, Play, RotateCcw, X } from "lucide-react";
import {
  ArcadeRoundController,
  type ArcadeGame,
} from "@/client/arcade-round-controller";
import { VeyCharacter } from "./vey-character";
import { api } from "@/client/api";
import { errorMessage } from "@/domain/errors";
import { StreakFlame } from "./streak-flame";

const gameNames = {
  challenge: "Speaking Challenge",
  survival: "Speak or Die",
  runner: "IELTS Runner",
};
const topics = {
  exam: [
    "Describe a place you would like to visit.",
    "Should children learn a foreign language early?",
    "What makes a good neighbour?",
    "How has technology changed education?",
    "Describe a skill you would like to learn.",
  ],
  crazy: [
    "Cats are better than dogs.",
    "AI will take your job.",
    "Hard work beats talent.",
    "We should have a three-day weekend.",
    "Would you live on another planet?",
  ],
};
const questions = [
  {
    text: "A word that means ‘very important’",
    answers: ["crucial", "casual", "minimal"],
    correct: 0,
  },
  {
    text: "Despite ___ tired, she finished her essay.",
    answers: ["be", "being", "was"],
    correct: 1,
  },
  {
    text: "A formal alternative to ‘a lot of’",
    answers: ["tiny", "barely", "numerous"],
    correct: 2,
  },
  {
    text: "The chart shows a steady ___ in sales.",
    answers: ["increase", "increasing", "increased"],
    correct: 0,
  },
  {
    text: "Which phrase introduces a contrast?",
    answers: ["As a result", "However", "In addition"],
    correct: 1,
  },
  {
    text: "The opposite of ‘temporary’",
    answers: ["occasional", "brief", "permanent"],
    correct: 2,
  },
  {
    text: "If I had more time, I ___ travel more.",
    answers: ["will", "would", "can"],
    correct: 1,
  },
  {
    text: "A synonym for ‘reduce’",
    answers: ["expand", "maintain", "decrease"],
    correct: 2,
  },
];

export function ArcadeGameDialog({
  game,
  onClose,
}: {
  game: ArcadeGame;
  onClose: () => void;
}) {
  const [controller] = useState(() => new ArcadeRoundController());
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  const [duration, setDuration] = useState(60);
  const [difficulty, setDifficulty] = useState(3);
  const [topicSet, setTopicSet] = useState<"exam" | "crazy">("exam");
  const [topic, setTopic] = useState(topics.exam[0]);
  const [question, setQuestion] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [roundId, setRoundId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [saveError, setSaveError] = useState("");
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      void controller.destroy();
    };
  }, [controller]);
  async function start() {
    if (starting || saving) return;
    setStarting(true);
    setSaveError("");
    setSaved(null);
    setTopic(
      topics[topicSet][Math.floor(Math.random() * topics[topicSet].length)],
    );
    setQuestion(0);
    setFeedback("");
    try {
      const round = await api<{ id: string }>("/api/arcade-rounds", {
        method: "POST",
        body: JSON.stringify({ game, duration }),
      });
      if (!mounted.current) return;
      setRoundId(round.id);
      await controller.start(game, duration, difficulty);
    } catch (error) {
      setSaveError(errorMessage(error));
    } finally {
      setStarting(false);
    }
  }
  const saveRound = useCallback(async () => {
    const result = controller.getSnapshot();
    if (!roundId || result.phase !== "finished") return;
    setSaving(true);
    setSaveError("");
    try {
      const savedRound = await api<{ completed: boolean }>(
        `/api/arcade-rounds/${roundId}`,
        {
          method: "POST",
          keepalive: true,
          body: JSON.stringify({
            elapsed: result.elapsed,
            speechSeconds: result.speechSeconds,
            answers: result.answers,
          }),
        },
      );
      setSaved(savedRound.completed);
    } catch (error) {
      setSaveError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }, [controller, roundId]);
  useEffect(() => {
    let previous = controller.getSnapshot().phase;
    return controller.subscribe(() => {
      const phase = controller.getSnapshot().phase;
      if (phase === "finished" && previous !== "finished") void saveRound();
      previous = phase;
    });
  }, [controller, saveRound]);
  function answer(index: number) {
    const current = questions[question];
    const correct = index === current.correct;
    controller.answer(correct);
    setFeedback(
      correct
        ? "Correct! Keep going."
        : `The answer was “${current.answers[current.correct]}”.`,
    );
    if (question === questions.length - 1) controller.finish();
    else setQuestion(question + 1);
  }
  useEffect(() => {
    if (game !== "runner" || state.phase !== "playing") return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.repeat || !["1", "2", "3"].includes(event.key)) return;
      document
        .getElementById(`runner-answer-${Number(event.key) - 1}`)
        ?.click();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [game, state.phase]);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="arcade-game-overlay" />
        <Dialog.Content className="arcade-game-dialog">
          <header>
            <Dialog.Close aria-label="Back to Arcade">
              <ArrowLeft size={18} />
              Back
            </Dialog.Close>
            <Dialog.Title>{gameNames[game]}</Dialog.Title>
            <Dialog.Close aria-label="Leave game">
              <X size={20} />
            </Dialog.Close>
          </header>
          <div className="arcade-game-body">
            <Dialog.Description className="sr-only">
              Choose your settings and start a practice round.
            </Dialog.Description>
            {["setup", "connecting", "error"].includes(state.phase) ? (
              <div className="arcade-setup">
                <div>
                  <span className="orbit-game-badge">
                    {game === "runner"
                      ? "VOCABULARY SPRINT"
                      : "SPEAKING PRACTICE"}
                  </span>
                  <h2>{gameNames[game]}</h2>
                  <p>
                    {game === "runner"
                      ? "Three lanes, one right answer. Choose with the buttons or keys 1, 2 and 3."
                      : "Spin the barrel, get a topic, and keep talking until the timer runs out."}
                  </p>
                  <fieldset>
                    <legend>How long?</legend>
                    <div>
                      {[30, 60].map((value) => (
                        <button
                          key={value}
                          aria-pressed={duration === value}
                          onClick={() => setDuration(value)}
                        >
                          {value} sec
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  {game !== "runner" && (
                    <fieldset>
                      <legend>Topics</legend>
                      <div>
                        {(["exam", "crazy"] as const).map((value) => (
                          <button
                            key={value}
                            aria-pressed={topicSet === value}
                            onClick={() => setTopicSet(value)}
                          >
                            {value === "exam" ? "Exam topics" : "Crazy topics"}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  )}
                  {game === "survival" && (
                    <fieldset>
                      <legend>Difficulty</legend>
                      <div>
                        {[
                          { label: "Easy", value: 5 },
                          { label: "Medium", value: 3 },
                          { label: "Hard", value: 2 },
                          { label: "Extra Hard", value: 1.5 },
                        ].map((value) => (
                          <button
                            key={value.label}
                            aria-pressed={difficulty === value.value}
                            onClick={() => setDifficulty(value.value)}
                          >
                            {value.label}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  )}
                  {(state.error || saveError) && (
                    <p className="arcade-game-error" role="alert">
                      {state.error || saveError}
                    </p>
                  )}
                  <button
                    className="arcade-play arcade-start"
                    onClick={start}
                    disabled={starting || state.phase === "connecting"}
                  >
                    <Play size={20} fill="currentColor" />
                    {starting
                      ? "Starting round…"
                      : state.phase === "connecting"
                        ? "Connecting microphone…"
                        : state.error
                          ? "Try again"
                          : "Start"}
                  </button>
                  {game !== "runner" && (
                    <small className="arcade-privacy">
                      Microphone audio stays on this device.
                    </small>
                  )}
                </div>
                <div className="arcade-topic-barrel">
                  {topics[topicSet].map((value, index) => (
                    <span key={value} className={index === 2 ? "selected" : ""}>
                      {value}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="arcade-round">
                <div
                  className="arcade-round-time"
                  role="timer"
                  aria-label="Time remaining"
                >
                  {Math.ceil(duration - state.elapsed)}
                  <small>seconds left</small>
                </div>
                <VeyCharacter
                  size={180}
                  state={state.phase === "finished" ? "success" : "listening"}
                  intensity={state.intensity}
                />
                {state.phase === "finished" ? (
                  <>
                    <h2>Round complete</h2>
                    <p>
                      {game === "runner"
                        ? `${state.score} points · ${state.answers} questions`
                        : `${Math.round(state.speechSeconds)} seconds speaking · ${Math.round(state.elapsed)} seconds practised`}
                    </p>
                    <div className="arcade-streak-status" role="status">
                      <StreakFlame size={30} lit={saved === true} />
                      <span>
                        {saving
                          ? "Saving your practice…"
                          : saved === true
                            ? "Today's flame is lit"
                            : saved === false
                              ? "Finish a full round with answers or speech to light your flame."
                              : ""}
                      </span>
                    </div>
                    {saveError && (
                      <div role="alert">
                        <p className="arcade-game-error">{saveError}</p>
                        <button
                          className="arcade-back"
                          onClick={() => void saveRound()}
                        >
                          Retry saving round
                        </button>
                      </div>
                    )}
                    <button
                      className="arcade-play arcade-start"
                      onClick={start}
                      disabled={starting || saving}
                    >
                      <RotateCcw size={18} />
                      Play again
                    </button>
                    <Dialog.Close className="arcade-back">
                      Back to Arcade
                    </Dialog.Close>
                  </>
                ) : game === "runner" ? (
                  <>
                    <h2>{questions[question].text}</h2>
                    <div className="arcade-lanes">
                      {questions[question].answers.map((value, index) => (
                        <button
                          id={`runner-answer-${index}`}
                          key={`${question}-${index}`}
                          onClick={() => answer(index)}
                        >
                          <small>{index + 1}</small>
                          {value}
                        </button>
                      ))}
                    </div>
                    <p className="arcade-answer-feedback" aria-live="polite">
                      {feedback || "Choose a lane to answer"}
                    </p>
                    <button
                      className="arcade-back"
                      onClick={() => controller.finish()}
                    >
                      End round
                    </button>
                  </>
                ) : (
                  <>
                    <h2>{topic}</h2>
                    <p className="arcade-listening">
                      <Mic size={18} />
                      {state.intensity > 0.14
                        ? "We can hear you — keep going!"
                        : "Speak into your microphone"}
                    </p>
                    {game === "survival" && (
                      <progress
                        aria-label="Silence limit"
                        max={difficulty}
                        value={Math.min(difficulty, state.silence)}
                      />
                    )}
                    <button
                      className="arcade-back"
                      onClick={() => controller.finish()}
                    >
                      End round
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
