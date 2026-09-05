import { contentEntrySchema } from "@veylo/contracts/schemas/task";
import { ContentRules } from "../../domain/content-rules";

export class ContentValidator {
  constructor(private readonly rules = new ContentRules()) {}

  validate(entries: unknown[]) {
    return this.rules.validate(
      entries.map((entry) => contentEntrySchema.parse(entry)),
    );
  }
}
