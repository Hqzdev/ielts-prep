import type { Answer } from "./attempt";
import type { ReadingVerdict } from "./assessment";
import type { ReadingKey, ReadingQuestion, Task } from "./task";
import { AppError } from "./errors";

export class ReadingGrader {
  grade(task: Task, answer: Answer, keys: ReadingKey[]): ReadingVerdict[] {
    if (
      task.skill !== "reading" ||
      keys.length !== task.readingQuestions.length
    ) {
      throw new AppError(
        "INVALID_READING_KEY",
        "The answer key is not ready for grading",
        500,
      );
    }
    return task.readingQuestions.map((question) => {
      const key = keys.find(
        (candidate) => candidate.number === question.number,
      );
      if (!key)
        throw new AppError(
          "MISSING_READING_KEY",
          "Question answer key not found",
          500,
        );
      const raw = answer.reading[String(question.number)];
      const given = Array.isArray(raw) ? raw : raw ? [raw] : [];
      const normalized = [
        ...new Set(given.map((value) => this.normalize(value))),
      ];
      const expected = key.answers.map((value) => this.normalize(value));
      let possible = 1;
      let earned = 0;
      if (question.mode === "multiple") {
        possible = question.selectCount;
        earned =
          normalized.length <= question.selectCount
            ? normalized.filter((value) => expected.includes(value)).length
            : 0;
      } else if (
        normalized.length === 1 &&
        this.withinWordLimit(question, given[0])
      ) {
        earned = [
          ...expected,
          ...key.alternatives.map((value) => this.normalize(value)),
        ].includes(normalized[0])
          ? 1
          : 0;
      }
      const explanation =
        question.mode === "text" &&
        given.length &&
        !this.withinWordLimit(question, given[0])
          ? `Your answer exceeds the word limit. ${key.explanation}`
          : key.explanation;
      return {
        number: question.number,
        statement: question.statement,
        given,
        expected: key.answers,
        correct: earned === possible,
        earned,
        possible,
        paragraph: key.paragraph,
        evidence: key.evidence,
        explanation,
      };
    });
  }

  private normalize(value: string): string {
    return value
      .normalize("NFKC")
      .trim()
      .replace(/[‘’]/g, "'")
      .replace(/[‐‑–]/g, "-")
      .replace(/\s+/g, " ")
      .toLocaleLowerCase("en");
  }

  private withinWordLimit(question: ReadingQuestion, value: string): boolean {
    if (question.mode !== "text" || !question.maxWords) return true;
    const tokens = this.normalize(value).split(/\s+/).filter(Boolean);
    const numbers = tokens.filter((token) =>
      /^\d+(?:[.,]\d+)*%?$/.test(token),
    ).length;
    return question.allowNumber
      ? numbers <= 1 && tokens.length - numbers <= question.maxWords
      : tokens.length <= question.maxWords;
  }
}
