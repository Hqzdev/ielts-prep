import { contentEntrySchema, type ContentEntry } from "./task";
import { ReadingGrader } from "./reading-grader";

export class ContentValidator {
  validate(entries: unknown[]): ContentEntry[] {
    const parsed = entries.map((entry) => contentEntrySchema.parse(entry));
    const ids = new Set<string>();
    for (const entry of parsed) {
      const { task, readingKey } = entry;
      if (ids.has(task.id)) throw new Error(`DUPLICATE_ID:${task.id}`);
      ids.add(task.id);
      if (task.skill === "reading") {
        if (
          !task.paragraphs.length ||
          readingKey.length !== task.readingQuestions.length
        )
          throw new Error(`INCOMPLETE_READING:${task.id}`);
        const numbers = task.readingQuestions.map((q) => q.number);
        if (new Set(numbers).size !== numbers.length)
          throw new Error(`DUPLICATE_QUESTION:${task.id}`);
        for (const key of readingKey) {
          const paragraph = task.paragraphs.find(
            (p) => p.label === key.paragraph,
          );
          if (!paragraph?.text.includes(key.evidence))
            throw new Error(`INVALID_EVIDENCE:${task.id}:${key.number}`);
          const question = task.readingQuestions.find(
            (q) => q.number === key.number,
          );
          if (!question) throw new Error(`INVALID_KEY:${task.id}`);
          if (
            question.mode === "multiple" &&
            key.answers.length !== question.selectCount
          )
            throw new Error(`INVALID_SELECTION_COUNT:${task.id}`);
          if (
            question.mode !== "text" &&
            key.answers.some(
              (answer) =>
                !question.options.some((option) => option.value === answer),
            )
          )
            throw new Error(`INVALID_OPTION:${task.id}`);
        }
        const verdicts = new ReadingGrader().grade(
          task,
          {
            text: "",
            audioIds: [],
            reading: Object.fromEntries(
              readingKey.map((key) => [
                key.number,
                task.readingQuestions.find((q) => q.number === key.number)
                  ?.mode === "multiple"
                  ? key.answers
                  : key.answers[0],
              ]),
            ),
          },
          readingKey,
        );
        if (verdicts.some((v) => !v.correct))
          throw new Error(`KEY_FAILS_GRADER:${task.id}`);
        if (task.readingLayout === "diagram" && !task.diagram?.nodes.length)
          throw new Error(`MISSING_DIAGRAM:${task.id}`);
      }
      if (task.visual) {
        if (
          task.visual.chartType === "process_diagram" &&
          !task.visual.processSteps.length
        )
          throw new Error(`EMPTY_PROCESS:${task.id}`);
        if (
          task.visual.chartType !== "process_diagram" &&
          (!task.visual.periods.length ||
            task.visual.dataSeries.some((s) =>
              task.visual!.periods.some((p) => !Number.isFinite(s.values[p])),
            ))
        )
          throw new Error(`INVALID_CHART:${task.id}`);
      }
    }
    return parsed;
  }
}
