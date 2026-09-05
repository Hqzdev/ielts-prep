import { ContentRules } from "../../domain/content-rules";
import type { ContentEntry } from "../../domain/task";
import type { ContentStore } from "../ports/administration";
import type { ContentEncoding } from "../ports/runtime";

export class ContentImporter {
  constructor(
    private readonly store: ContentStore,
    private readonly encoding: ContentEncoding,
  ) {}

  async import(entries: ContentEntry[]) {
    const validated = new ContentRules().validate(entries);
    const report = { created: 0, updated: 0, unchanged: 0 };
    for (const entry of validated) {
      const hash = this.encoding.fingerprint(
        JSON.stringify({ ...entry, task: { ...entry.task, version: 0 } }),
      );
      report[await this.store.import(entry, hash)]++;
    }
    return report;
  }
}
