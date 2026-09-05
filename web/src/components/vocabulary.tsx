"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookmarkSimple,
  Check,
  MagnifyingGlass,
  Play,
  SpeakerHigh,
} from "@phosphor-icons/react";
import { topicLabels } from "@/domain/task";
import type {
  VocabularyWord,
  VocabularyQuiz,
  QuizAnswer,
} from "@/domain/vocabulary";
import { api } from "@/client/api";
import { errorMessage } from "@/domain/errors";
import { Button, ErrorNotice } from "./ui";
import Link from "next/link";
import { WordComposer } from "./word-composer";
import { VeyCharacter, OrbitProgress, PageHeading } from "./orbit-ui";

export function Vocabulary({
  initial,
  userId,
  aiAvailable,
}: {
  initial: VocabularyWord[];
  userId: string;
  aiAvailable: boolean;
}) {
  const [words, setWords] = useState(initial);
  const [topic, setTopic] = useState("");
  const [personal, setPersonal] = useState(false);
  const [query, setQuery] = useState("");
  const [deckQuery, setDeckQuery] = useState("");
  const [sortByProgress, setSortByProgress] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [limit, setLimit] = useState(30);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const visible = words.filter(
    (word) =>
      (!topic || word.topic === topic) &&
      (!personal || word.ownerId === userId || word.saved) &&
      `${word.term} ${word.translation}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  if (sortByProgress)
    visible.sort(
      (a, b) =>
        (a.total ? a.correct / a.total : 0) -
        (b.total ? b.correct / b.total : 0),
    );
  const topics = [...new Set(words.map((word) => word.topic))];
  const collections = topics.slice(0, 6).map((value) => {
    const collectionWords = words.filter((word) => word.topic === value);
    const attempts = collectionWords.reduce((sum, word) => sum + word.total, 0);
    const correct = collectionWords.reduce(
      (sum, word) => sum + word.correct,
      0,
    );
    return {
      value,
      total: collectionWords.length,
      progress: attempts ? Math.round((correct / attempts) * 100) : 0,
    };
  });
  const due = words.filter((word) => word.total > word.correct).length;
  async function quiz() {
    setBusy(true);
    setError(null);
    try {
      const quiz = await api<VocabularyQuiz>("/api/vocabulary/quizzes", {
        method: "POST",
        body: JSON.stringify({ topic: topic || undefined, personal }),
      });
      router.push(`/vocabulary/quiz/${quiz.id}`);
    } catch (error) {
      setError(errorMessage(error));
      setBusy(false);
    }
  }
  async function save(word: VocabularyWord) {
    try {
      await api("/api/vocabulary/saved", {
        method: "POST",
        body: JSON.stringify({ wordId: word.id, saved: !word.saved }),
      });
      setWords(
        words.map((w) => (w.id === word.id ? { ...w, saved: !w.saved } : w)),
      );
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  return (
    <div className="orbit-page orbit-vocabulary-page">
      <PageHeading title="Vocabulary" subtitle="Your personal word bank" />
      <section className="orbit-vocabulary-hero">
        <div>
          <span className="orbit-kicker">DAILY</span>
          <h2>Daily review</h2>
          <p>Review your words and add new ones.</p>
          <div>
            <Button onClick={quiz} busy={busy}>
              <Play size={16} weight="fill" /> Start review
              <span className="orbit-count-badge">
                {due || Math.min(10, words.length)}
              </span>
            </Button>
            <WordComposer
              aiAvailable={aiAvailable}
              onSaved={async () =>
                setWords(await api<VocabularyWord[]>("/api/vocabulary"))
              }
            />
          </div>
        </div>
        <VeyCharacter expression="happy" size={130} />
      </section>
      <ErrorNotice message={error} />

      <section className="orbit-vocabulary-section">
        <div className="orbit-section-heading">
          <div>
            <h2>Word decks</h2>
            <p>
              Pick themes to steer your daily words. Add nothing and we choose
              for you.
            </p>
          </div>
          <button
            type="button"
            className={
              personal ? "orbit-filter-pill active" : "orbit-filter-pill"
            }
            onClick={() => setPersonal(!personal)}
          >
            {personal ? "Showing saved" : "Show saved"}
          </button>
        </div>
        <span className="orbit-deck-label">YOUR DECKS</span>
        <div className="orbit-collection-grid">
          {collections.map((collection) => (
            <button
              type="button"
              key={collection.value}
              className={topic === collection.value ? "active" : ""}
              onClick={() =>
                setTopic(topic === collection.value ? "" : collection.value)
              }
            >
              <span>{collection.progress}%</span>
              <div>
                <strong>
                  {topicLabels[collection.value] ?? collection.value}
                </strong>
                <small>{collection.total} words</small>
              </div>
              <OrbitProgress value={collection.progress} />
            </button>
          ))}
        </div>
        <div className="orbit-search-bar orbit-deck-search">
          <MagnifyingGlass size={17} />
          <input
            aria-label="Search decks"
            placeholder="Search decks"
            value={deckQuery}
            onChange={(event) => setDeckQuery(event.target.value)}
          />
        </div>
        <span className="orbit-deck-label">TOPICS</span>
        <div className="orbit-topic-pills">
          {topics
            .filter((value) =>
              (topicLabels[value] ?? value)
                .toLowerCase()
                .includes(deckQuery.toLowerCase()),
            )
            .map((value) => (
              <button
                type="button"
                key={value}
                className={topic === value ? "active" : ""}
                aria-pressed={topic === value}
                onClick={() => setTopic(topic === value ? "" : value)}
              >
                + {topicLabels[value] ?? value}
              </button>
            ))}
        </div>
      </section>

      <section className="orbit-vocabulary-section orbit-word-bank">
        <div className="orbit-section-heading">
          <div>
            <h2>
              Dictionary <span>· {visible.length}</span>
            </h2>
          </div>
        </div>
        <div className="orbit-dictionary-controls">
          <div className="orbit-search-bar">
            <MagnifyingGlass size={19} weight="bold" />
            <input
              aria-label="Search vocabulary"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search words"
            />
          </div>
          <button
            className="orbit-word-controls"
            aria-pressed={personal}
            onClick={() => setPersonal(!personal)}
          >
            Filters{personal ? " · Saved" : ""}
          </button>
          <button
            className="orbit-word-controls"
            aria-pressed={sortByProgress}
            onClick={() => setSortByProgress(!sortByProgress)}
          >
            By progress
          </button>
        </div>
        <div className="orbit-word-list">
          {visible.slice(0, limit).map((word) => {
            const progress = word.total
              ? Math.round((word.correct / word.total) * 100)
              : 0;
            return (
              <article key={word.id}>
                <div className="orbit-word-main">
                  <button
                    className="orbit-word-toggle"
                    aria-expanded={expanded === word.id}
                    onClick={() =>
                      setExpanded(expanded === word.id ? null : word.id)
                    }
                  >
                    <strong>{word.term}</strong>
                    <span>
                      {word.partOfSpeech} ·{" "}
                      {topicLabels[word.topic] ?? word.topic}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="orbit-word-sound"
                    aria-label={`Hear ${word.term}`}
                    onClick={() => {
                      if (!("speechSynthesis" in window)) {
                        setError(
                          "Pronunciation is unavailable in this browser.",
                        );
                        return;
                      }
                      window.speechSynthesis.cancel();
                      const utterance = new SpeechSynthesisUtterance(word.term);
                      utterance.lang = "en-GB";
                      utterance.rate = 0.85;
                      utterance.onerror = (event) => {
                        if (
                          event.error !== "interrupted" &&
                          event.error !== "canceled"
                        )
                          setError("Pronunciation could not play. Try again.");
                      };
                      window.speechSynthesis.speak(utterance);
                    }}
                  >
                    <SpeakerHigh size={18} />
                  </button>
                  <span className="orbit-word-progress">{progress}%</span>
                  <button
                    type="button"
                    className="orbit-word-save"
                    onClick={() => save(word)}
                    aria-label={
                      word.saved
                        ? `Remove ${word.term} from my vocabulary`
                        : `Save ${word.term}`
                    }
                  >
                    <BookmarkSimple
                      size={19}
                      weight={word.saved ? "fill" : "bold"}
                    />
                  </button>
                </div>
                {expanded === word.id && (
                  <div className="orbit-word-detail">
                    <strong>{word.translation}</strong>
                    <p>{word.example}</p>
                  </div>
                )}
              </article>
            );
          })}
          {visible.length > limit && (
            <Button variant="secondary" onClick={() => setLimit(limit + 30)}>
              Load more words
            </Button>
          )}
          {!visible.length && (
            <div className="orbit-word-empty">
              <VeyCharacter state="thinking" size={86} />
              <span>No words match these filters.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export function VocabularyTest({ initial }: { initial: VocabularyQuiz }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState(initial.result);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const question = initial.questions[index];
  async function finish() {
    setBusy(true);
    try {
      setResult(
        await api<QuizAnswer[]>(
          `/api/vocabulary/quizzes/${initial.id}/submit`,
          { method: "POST", body: JSON.stringify({ answers }) },
        ),
      );
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page" style={{ maxWidth: 1050 }}>
      <div className="breadcrumb">
        <Link href="/vocabulary">Vocabulary</Link>
        <span>/</span>
        <span>Quick quiz</span>
      </div>
      <h1>{result ? "Your vocabulary results" : "Test your vocabulary"}</h1>
      <ErrorNotice message={error} />
      {result ? (
        <>
          <div className="result-overview">
            <div>
              <div className="band-number">
                {result.filter((r) => r.correct).length}
                <span> / 10</span>
              </div>
              <p className="small muted">Correct answers</p>
            </div>
            <div>
              <h2>Words you missed will appear more often</h2>
              <p className="muted">
                Practise them in context and watch your results improve.
              </p>
            </div>
          </div>
          {result.map((answer) => (
            <div className="feedback-row" key={answer.questionId}>
              <span className="feedback-index">
                {answer.correct ? <Check size={16} /> : answer.questionId}
              </span>
              <div>
                <h3>
                  {answer.term} — {answer.translation}
                </h3>
                {!answer.correct && (
                  <p className="small">
                    Your answer: {answer.given || "No answer"} →{" "}
                    <span className="link">{answer.expected}</span>
                  </p>
                )}
                <p className="small muted">{answer.example}</p>
              </div>
            </div>
          ))}
          <Link className="button" href="/vocabulary">
            Back to vocabulary
          </Link>
        </>
      ) : (
        <>
          <div className="spread section">
            <span className="small muted">
              Question {index + 1} of {initial.questions.length}
            </span>
            <span className="tag">
              {question.type === "translation"
                ? "Choose the meaning"
                : "Fill in the gap"}
            </span>
          </div>
          <div className="progress-track" style={{ marginTop: 14 }}>
            <span style={{ width: `${((index + 1) / 10) * 100}%` }} />
          </div>
          <div className="panel section">
            <h2 style={{ lineHeight: 1.7 }}>{question.prompt}</h2>
            {question.type === "translation" ? (
              <div className="stack">
                {question.options.map((option) => (
                  <label
                    className="mode-choice"
                    key={option}
                    style={{ margin: 0 }}
                  >
                    <span className="row">
                      <input
                        type="radio"
                        name={question.id}
                        checked={answers[question.id] === option}
                        onChange={() =>
                          setAnswers({ ...answers, [question.id]: option })
                        }
                      />
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <input
                className="answer-input"
                aria-label="Missing word"
                value={answers[question.id] ?? ""}
                onChange={(e) =>
                  setAnswers({ ...answers, [question.id]: e.target.value })
                }
                autoComplete="off"
              />
            )}
          </div>
          <div className="spread section">
            <Button
              variant="secondary"
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
            >
              Back
            </Button>
            {index === 9 ? (
              <Button onClick={finish} busy={busy}>
                Finish quiz <Check size={16} />
              </Button>
            ) : (
              <Button onClick={() => setIndex(index + 1)}>
                Next <ArrowRight size={16} />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
