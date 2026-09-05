"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle, Plus, Check } from "lucide-react";
import { api } from "@/client/api";
import {
  ConversationMetrics,
  type ConversationFeedback,
} from "@/domain/conversation-feedback";
import type { ConversationMessage } from "@/domain/voice-conversation";
import { VeyCharacter } from "./vey-character";

function FeedbackWord({
  word,
}: {
  word: ConversationFeedback["words"][number];
}) {
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    setPending(true);
    setError("");
    try {
      await api("/api/vocabulary/words", {
        method: "POST",
        body: JSON.stringify({
          term: word.term,
          translation: word.meaning,
          example: word.example,
          partOfSpeech: word.partOfSpeech,
          topic: "Speaking practice",
        }),
      });
      setSaved(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not save this word. Please retry.",
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="preppy-feedback-word">
      <div>
        <strong>{word.term}</strong>
        <p>{word.meaning}</p>
        <p>{word.example}</p>
        {error && <p role="alert">{error}</p>}
      </div>
      <button
        aria-label={saved ? `${word.term} saved` : `Save ${word.term}`}
        disabled={saved || pending}
        onClick={() => void save()}
      >
        {saved ? (
          <Check size={15} />
        ) : pending ? (
          <LoaderCircle className="preppy-spinner" size={15} />
        ) : (
          <Plus size={15} />
        )}
      </button>
    </div>
  );
}

export function ConversationSummary({
  threadId,
  messages,
  onClose,
}: {
  threadId?: string;
  messages: ConversationMessage[];
  onClose: () => void;
}) {
  const metrics = new ConversationMetrics(messages);
  const [feedback, setFeedback] = useState<ConversationFeedback | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [short, setShort] = useState(false);
  const sufficient = metrics.sufficient;
  useEffect(() => {
    if (!sufficient || !threadId) return;
    const abort = new AbortController();
    api<{ status: "ready" | "too_short"; feedback?: ConversationFeedback }>(
      "/api/chat/feedback",
      {
        method: "POST",
        body: JSON.stringify({ threadId }),
        signal: abort.signal,
      },
    )
      .then((result) => {
        if (!abort.signal.aborted) {
          if (result.feedback) setFeedback(result.feedback);
          setShort(result.status === "too_short");
        }
      })
      .catch((error) => {
        if (!abort.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Could not analyse this conversation. Please retry.",
          );
      });
    return () => abort.abort();
  }, [threadId, sufficient, retry]);
  const download = () => {
    const url = URL.createObjectURL(
      new Blob(
        [
          messages
            .map(
              (message) =>
                `${message.role === "user" ? "You" : "Vey"}: ${message.content}`,
            )
            .join("\n\n"),
        ],
        { type: "text/plain;charset=utf-8" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "vey-conversation.txt";
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="preppy-summary">
      {!sufficient || short ? (
        <div className="preppy-summary-empty">
          <VeyCharacter size={96} motion="farewell" />
          <h2>Keep talking next time!</h2>
          <p>
            The conversation was too short to analyse. Say a little more next
            time — at least a few sentences.
          </p>
        </div>
      ) : (
        <>
          <div className="preppy-summary-header">
            <VeyCharacter size={96} motion="victory" />
            <h1>Your conversation</h1>
            <p>Here&apos;s how you did. Your text history is saved.</p>
          </div>
          <div className="preppy-summary-metrics">
            {[
              [metrics.words, "Words spoken"],
              [metrics.uniqueWords, "Unique words"],
              [metrics.answers, "Your turns"],
              [metrics.sentences, "Sentences"],
            ].map(([value, label]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          {error ? (
            <div className="preppy-error" role="alert">
              <span>{error}</span>
              <button
                className="preppy-primary"
                onClick={() => {
                  setError("");
                  setRetry(retry + 1);
                }}
              >
                Retry
              </button>
            </div>
          ) : !feedback ? (
            <div className="preppy-feedback-block">
              <LoaderCircle className="preppy-spinner" size={20} />
              <p>Vey is reviewing your conversation…</p>
            </div>
          ) : (
            <div className="preppy-feedback-grid">
              <div>
                <section className="preppy-feedback-block">
                  <h2>Strengths</h2>
                  <ul>
                    {feedback.strengths.map((strength) => (
                      <li key={strength}>{strength}</li>
                    ))}
                  </ul>
                </section>
                <section className="preppy-feedback-block">
                  <h2>Growth areas</h2>
                  {feedback.improvements.map((item) => (
                    <div key={item.quote}>
                      <p>
                        “{item.quote}” → <strong>{item.correction}</strong>
                      </p>
                      <p>{item.explanation}</p>
                    </div>
                  ))}
                </section>
              </div>
              <div>
                <section className="preppy-feedback-block">
                  <h2>Words to take away</h2>
                  {feedback.words.map((word) => (
                    <FeedbackWord word={word} key={word.term} />
                  ))}
                </section>
                <Link
                  href="/tests/speaking"
                  className="preppy-feedback-block"
                  style={{ display: "block" }}
                >
                  Try a Speaking test →
                </Link>
              </div>
            </div>
          )}
        </>
      )}
      <div className="preppy-summary-actions">
        <button className="preppy-primary" onClick={onClose}>
          Back to Vey
        </button>
        {messages.length > 0 && (
          <button className="preppy-history-link" onClick={download}>
            Download text history
          </button>
        )}
      </div>
    </div>
  );
}
