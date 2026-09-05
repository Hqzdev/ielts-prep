"use client";
import { useState } from "react";
import { BookmarkSimple, Sparkle } from "@phosphor-icons/react";
import { api, apiData } from "@/client/api";
import { errorMessage } from "@veylo/backend/domain/errors";
import { topicLabels } from "@veylo/ui-web/domain/formatting";
import { Button, Modal, ErrorNotice } from "./ui";

const emptyWord = {
  term: "",
  translation: "",
  partOfSpeech: "noun",
  topic: "education",
  example: "",
};

export function WordComposer({
  topic = "education",
  aiAvailable = false,
  captureSelection = false,
  onSaved,
}: {
  topic?: string;
  aiAvailable?: boolean;
  captureSelection?: boolean;
  onSaved?: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState({ ...emptyWord, topic });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function suggest() {
    setBusy(true);
    setError(null);
    try {
      setWord(
        await apiData(
          api.POST("/vocabulary/suggest", {
            body: { term: word.term, topic: word.topic },
          }),
        ),
      );
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiData(api.POST("/vocabulary/words", { body: word }));
      await onSaved?.();
      setOpen(false);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          const selected = captureSelection
            ? (window.getSelection()?.toString().trim() ?? "")
            : "";
          setWord({
            ...emptyWord,
            topic,
            term: selected.length <= 100 ? selected : "",
          });
          setError(null);
          setOpen(true);
        }}
      >
        <BookmarkSimple size={16} weight="bold" />
        {captureSelection ? "Save to vocabulary" : "Add words"}
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add words"
        description="Add an English definition and an example using this word. They will be used in your quizzes."
      >
        <form className="stack" onSubmit={save}>
          <label className="field">
            Word or expression
            <input
              value={word.term}
              onChange={(e) => setWord({ ...word, term: e.target.value })}
              required
              maxLength={100}
            />
          </label>
          {aiAvailable && (
            <Button
              variant="secondary"
              type="button"
              disabled={!word.term.trim()}
              busy={busy}
              onClick={suggest}
            >
              <Sparkle size={16} weight="fill" /> Suggest meaning and example
            </Button>
          )}
          <label className="field">
            Meaning in English
            <input
              value={word.translation}
              onChange={(e) =>
                setWord({ ...word, translation: e.target.value })
              }
              required
              maxLength={200}
            />
          </label>
          <div className="grid-two">
            <label className="field">
              Part of speech
              <input
                value={word.partOfSpeech}
                onChange={(e) =>
                  setWord({ ...word, partOfSpeech: e.target.value })
                }
                required
                maxLength={40}
              />
            </label>
            <label className="field">
              Topic
              <select
                value={word.topic}
                onChange={(e) => setWord({ ...word, topic: e.target.value })}
              >
                {Object.entries(topicLabels).map(([key, label]) => (
                  <option value={key} key={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            Example sentence
            <textarea
              value={word.example}
              onChange={(e) => setWord({ ...word, example: e.target.value })}
              required
              minLength={5}
              maxLength={700}
            />
          </label>
          <ErrorNotice message={error} />
          <Button type="submit" busy={busy}>
            Save word
          </Button>
        </form>
      </Modal>
    </>
  );
}
