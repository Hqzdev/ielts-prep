import { createHash } from "node:crypto";
import { z } from "zod";
import { handle, readBody } from "@/server/http";
import { adminClient } from "@/server/supabase";
import { currentProfile } from "@/server/identity";
import { config } from "@/server/config";
import { AppError } from "@/domain/errors";
export async function POST(request: Request) {
  return handle(async () => {
    const profile = await currentProfile();
    if (!profile) throw new AppError("UNAUTHENTICATED", "Please sign in", 401);
    const { token } = await readBody(
      request,
      z.object({ token: z.string().min(32).max(128) }),
    );
    const { error } = await adminClient().rpc("redeem_invitation", {
      p_user: profile.id,
      p_token_hash: createHash("sha256").update(token).digest("hex"),
      p_limit: config.betaLimit,
    });
    if (error)
      throw new AppError(
        "INVALID_INVITATION",
        "This invitation has expired, has already been used, or belongs to a different verified email address",
        403,
      );
    return { accepted: true };
  });
}
