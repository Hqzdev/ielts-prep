import { type Grade, type Transcript } from "@veylo/backend/domain/assessment";
import type { Attempt } from "@veylo/backend/domain/attempt";
import { AppError } from "@veylo/backend/domain/errors";

export const criterionKeys = {
  writing1: ["task_achievement", "coherence", "vocabulary", "grammar"],
  writing2: ["task_response", "coherence", "vocabulary", "grammar"],
  speaking: ["fluency", "vocabulary", "grammar", "pronunciation"],
};

export class GradeRules {
  validate(
    grade: Grade,
    attempt: Attempt,
    transcripts: Transcript[],
    durations: Record<string, number>,
  ): Grade {
    const task = attempt.taskSnapshot;
    const expected =
      task.skill === "speaking"
        ? criterionKeys.speaking
        : task.part === 1
          ? criterionKeys.writing1
          : criterionKeys.writing2;
    if (
      grade.sufficientEvidence &&
      (grade.criteria.length !== 4 ||
        expected.some((key) => !grade.criteria.some((c) => c.key === key)))
    )
      this.invalid();
    if (
      !grade.sufficientEvidence &&
      (grade.criteria.length || !grade.insufficientReason)
    )
      this.invalid();
    if (
      task.skill === "speaking" &&
      grade.sufficientEvidence &&
      !Object.keys(durations).length
    )
      this.invalid();
    const requirements = [
      task.prompt,
      ...task.cuePoints,
      ...task.speakingQuestions,
    ];
    for (const error of grade.errors) {
      const anchor = error.anchor;
      if (anchor.type === "text" && !attempt.answer.text.includes(anchor.quote))
        this.invalid();
      if (
        anchor.type === "requirement" &&
        !requirements.some((value) => value.includes(anchor.requirement))
      )
        this.invalid();
      if (anchor.type === "question") this.invalid();
      if (anchor.type === "audio") {
        if (
          task.skill !== "speaking" ||
          !durations[anchor.audioId] ||
          anchor.endSeconds <= anchor.startSeconds ||
          anchor.endSeconds > durations[anchor.audioId] + 0.1
        )
          this.invalid();
        if (
          anchor.quote &&
          !transcripts
            .find((t) => t.audioId === anchor.audioId)
            ?.text.includes(anchor.quote)
        )
          this.invalid();
      }
    }
    for (const item of grade.fulfilledRequirements)
      if (!requirements.includes(item.requirement)) this.invalid();
    return grade;
  }

  transcript(
    result: Transcript,
    audioId: string,
    duration: number,
  ): Transcript {
    if (result.audioId !== audioId) this.invalid();
    for (const segment of result.segments)
      if (
        segment.endSeconds <= segment.startSeconds ||
        segment.endSeconds > duration + 0.1 ||
        !result.text.includes(segment.text)
      )
        this.invalid();
    return result;
  }

  private invalid(): never {
    throw new AppError(
      "INVALID_AI_RESPONSE",
      "AI returned feedback with invalid references. Your work has been saved.",
      "upstream",
    );
  }
}
