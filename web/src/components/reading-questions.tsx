"use client";
import type { Task, ReadingQuestion } from "@/domain/task";
import type { Answer } from "@/domain/attempt";
import { ReadingDiagram } from "./task-visual";

function QuestionInput({
  question,
  value,
  onChange,
  disabled,
  reuseAllowed,
  answers,
}: {
  question: ReadingQuestion;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  disabled: boolean;
  reuseAllowed: boolean;
  answers: Answer["reading"];
}) {
  if (question.mode === "text")
    return (
      <input
        className="answer-input"
        aria-label={`Answer ${question.number}`}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        maxLength={500}
      />
    );
  if (question.mode === "single" && question.options.length > 4)
    return (
      <select
        className="question-select"
        aria-label={`Answer ${question.number}`}
        value={typeof value === "string" ? value : ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Choose an answer</option>
        {question.options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={
              !reuseAllowed &&
              Object.entries(answers).some(
                ([number, answer]) =>
                  number !== String(question.number) && answer === option.value,
              )
            }
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  return (
    <div className="options">
      {question.options.map((option) => {
        const selected = Array.isArray(value)
          ? value.includes(option.value)
          : value === option.value;
        return (
          <label key={option.value} className="option">
            <input
              type={question.mode === "multiple" ? "checkbox" : "radio"}
              name={`question-${question.number}`}
              checked={selected}
              disabled={
                disabled ||
                (question.mode === "multiple" &&
                  !selected &&
                  Array.isArray(value) &&
                  value.length >= question.selectCount)
              }
              onChange={() =>
                question.mode === "multiple"
                  ? onChange(
                      selected
                        ? (Array.isArray(value) ? value : []).filter(
                            (v) => v !== option.value,
                          )
                        : [
                            ...(Array.isArray(value) ? value : []),
                            option.value,
                          ],
                    )
                  : onChange(option.value)
              }
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
export function ReadingQuestions({
  task,
  answer,
  onChange,
  disabled,
}: {
  task: Task;
  answer: Answer;
  onChange: (answer: Answer) => void;
  disabled: boolean;
}) {
  return (
    <div className="reading-questions">
      <h2 style={{ fontSize: 18 }}>Questions</h2>
      <p className="instructions">{task.instructions}</p>
      {task.diagram && <ReadingDiagram diagram={task.diagram} />}
      <div className={`reading-${task.readingLayout}`}>
        {task.readingQuestions.map((question) => (
          <div className="question" key={question.number}>
            <div className="question-title">
              <span className="question-number">{question.number}</span>
              <label htmlFor={`q-${question.number}`}>
                {question.statement}
              </label>
            </div>
            <div id={`q-${question.number}`}>
              <QuestionInput
                question={question}
                value={
                  answer.reading[String(question.number)] ??
                  (question.mode === "multiple" ? [] : "")
                }
                onChange={(value) =>
                  onChange({
                    ...answer,
                    reading: { ...answer.reading, [question.number]: value },
                  })
                }
                disabled={disabled}
                reuseAllowed={task.reuseAllowed}
                answers={answer.reading}
              />
              {question.maxWords && (
                <small className="muted">
                  No more than {question.maxWords} words
                  {question.allowNumber ? " and one number" : ""}
                </small>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
