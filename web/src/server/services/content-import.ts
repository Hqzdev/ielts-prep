import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ContentValidator } from "@/domain/content-validator";

export class ContentImporter {
  constructor(
    private readonly db: SupabaseClient,
    private readonly validator = new ContentValidator(),
  ) {}
  async import(entries: unknown[]) {
    const validated = this.validator.validate(entries);
    const report = { created: 0, updated: 0, unchanged: 0 };
    for (const entry of validated) {
      const contentHash = createHash("sha256")
        .update(
          JSON.stringify({ ...entry, task: { ...entry.task, version: 0 } }),
        )
        .digest("hex");
      const { data, error } = await this.db.rpc("import_task", {
        p_content: entry.task,
        p_answers: entry.readingKey,
        p_hash: contentHash,
      });
      if (error)
        throw new Error(`IMPORT_FAILED:${entry.task.id}:${error.code}`);
      report[data as keyof typeof report]++;
    }
    return report;
  }
}
