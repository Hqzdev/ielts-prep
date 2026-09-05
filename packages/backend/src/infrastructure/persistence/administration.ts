import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdministrationStore,
  AdministrationOverview,
  ContentStore,
} from "../../application/ports/administration";
import type { ContentEntry } from "../../domain/task";
import { databaseError } from "./mapping";

export class SupabaseAdministrationStore implements AdministrationStore {
  constructor(private readonly db: SupabaseClient) {}
  async overview(): Promise<AdministrationOverview> {
    const [invitations, tasks, jobs, users] = await Promise.all([
      this.db
        .from("invitations")
        .select("id,email,expires_at,accepted_at,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      this.db
        .from("tasks")
        .select("id,skill,published,current_version")
        .order("id"),
      this.db
        .from("assessment_jobs")
        .select("id,assessment_id,state,tries,updated_at")
        .order("updated_at", { ascending: false })
        .limit(100),
      this.db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("beta_access", true),
    ]);
    for (const response of [invitations, tasks, jobs, users])
      databaseError(response.error);
    return {
      invitations: invitations.data ?? [],
      tasks: tasks.data ?? [],
      jobs: jobs.data ?? [],
      userCount: users.count ?? 0,
    };
  }

  async publish(id: string, published: boolean) {
    databaseError(
      (await this.db.from("tasks").update({ published }).eq("id", id)).error,
    );
  }
}

export class SupabaseContentStore implements ContentStore {
  constructor(private readonly db: SupabaseClient) {}

  async import(entry: ContentEntry, contentHash: string) {
    const { data, error } = await this.db.rpc("import_task", {
      p_content: entry.task,
      p_answers: entry.readingKey,
      p_hash: contentHash,
    });
    if (error) throw new Error(`IMPORT_FAILED:${entry.task.id}:${error.code}`);
    return data as "created" | "updated" | "unchanged";
  }
}
