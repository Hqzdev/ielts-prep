import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  IdentityStore,
  InvitationStore,
  AuthenticatedIdentity,
} from "../../application/ports/identity";
import type { Profile, ProfileInput } from "../../domain/profile";
import { AppError } from "../../domain/errors";
import { databaseError, camelRow } from "./mapping";

export class SupabaseIdentityStore implements IdentityStore {
  constructor(private readonly db: SupabaseClient) {}

  async verify(token: string) {
    const { data, error } = await this.db.auth.getUser(token);
    return !error && data.user
      ? { id: data.user.id, email: data.user.email ?? "" }
      : null;
  }

  async profile(identity: AuthenticatedIdentity) {
    const { data, error } = await this.db
      .from("profiles")
      .select("*")
      .eq("id", identity.id)
      .maybeSingle();
    databaseError(error);
    return data
      ? ({ ...camelRow(data), email: identity.email } as unknown as Profile)
      : null;
  }

  async save(userId: string, input: ProfileInput) {
    databaseError(
      (
        await this.db
          .from("profiles")
          .update({
            name: input.name,
            target_band: input.targetBand,
            self_reported_band: input.selfReportedBand,
            exam_date: input.examDate,
            daily_minutes: input.dailyMinutes,
            study_days: input.studyDays,
            timezone: input.timezone,
            onboarded: true,
          })
          .eq("id", userId)
      ).error,
    );
  }

  async deleteAccount(userId: string) {
    const { data, error } = await this.db
      .from("audio_assets")
      .select("path")
      .eq("user_id", userId);
    databaseError(error);
    if (data?.length)
      databaseError(
        (
          await this.db.storage
            .from("speaking")
            .remove(data.map((asset) => asset.path))
        ).error,
      );
    databaseError((await this.db.auth.admin.deleteUser(userId)).error);
  }

  async redeemInvitation(userId: string, tokenHash: string, limit: number) {
    const { error } = await this.db.rpc("redeem_invitation", {
      p_user: userId,
      p_token_hash: tokenHash,
      p_limit: limit,
    });
    if (error)
      throw new AppError(
        "INVALID_INVITATION",
        "This invitation has expired, has already been used, or belongs to a different verified email address",
        "forbidden",
      );
  }
}

export class SupabaseInvitationStore implements InvitationStore {
  constructor(private readonly db: SupabaseClient) {}

  async create(
    email: string,
    tokenHash: string,
    expiresAt: string,
    createdBy: string | null,
  ) {
    const { error } = await this.db.from("invitations").insert({
      email,
      token_hash: tokenHash,
      expires_at: expiresAt,
      created_by: createdBy,
    });
    if (error) throw new Error("INVITATION_SAVE_FAILED");
  }
}
