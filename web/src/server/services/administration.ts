import "server-only";
import { InvitationIssuer } from "./invitation-issuer";
import { adminClient } from "../supabase";
import { databaseError } from "../repositories/mapping";
import { config } from "../config";

export class AdministrationService {
  constructor(private readonly db = adminClient()) {}
  async overview() {
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
  async invite(userId: string, email: string) {
    return new InvitationIssuer(this.db, config.appUrl).issue(email, userId);
  }
  async publish(id: string, published: boolean) {
    databaseError(
      (await this.db.from("tasks").update({ published }).eq("id", id)).error,
    );
    return { published };
  }
}
