import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export class InvitationIssuer {
  constructor(
    private readonly db: SupabaseClient,
    private readonly appUrl: string,
  ) {}
  async issue(email: string, createdBy: string | null = null) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    const { error } = await this.db.from("invitations").insert({
      email: email.trim().toLowerCase(),
      token_hash: createHash("sha256").update(token).digest("hex"),
      expires_at: expiresAt,
      created_by: createdBy,
    });
    if (error) throw new Error("INVITATION_SAVE_FAILED");
    return {
      url: `${this.appUrl.replace(/\/$/, "")}/access?invite=${token}`,
      expiresAt,
    };
  }
}
