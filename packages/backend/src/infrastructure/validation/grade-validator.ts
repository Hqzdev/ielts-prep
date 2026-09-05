import {
  gradeSchema,
  transcriptSchema,
} from "@veylo/contracts/schemas/assessment";
import { GradeRules } from "../../domain/grade-rules";
import type { Attempt } from "../../domain/attempt";
import type { Transcript } from "../../domain/assessment";

export { criterionKeys } from "../../domain/grade-rules";

export class GradeValidator {
  constructor(private readonly rules = new GradeRules()) {}

  validate(
    raw: unknown,
    attempt: Attempt,
    transcripts: Transcript[],
    durations: Record<string, number>,
  ) {
    return this.rules.validate(
      gradeSchema.parse(raw),
      attempt,
      transcripts,
      durations,
    );
  }

  transcript(raw: unknown, audioId: string, duration: number) {
    return this.rules.transcript(
      transcriptSchema.parse(raw),
      audioId,
      duration,
    );
  }
}
