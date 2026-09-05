import { acceptInvitationSchema } from "@veylo/contracts/schemas/requests";

import { handle, readBody } from "@/server/http";
import { backend } from "@/server/backend";
import { currentProfile } from "@/server/identity";
import { AppError } from "@veylo/backend/domain/errors";

export async function POST(request: Request) {
  return handle(request, async () => {
    const profile = await currentProfile();
    if (!profile)
      throw new AppError(
        "UNAUTHENTICATED",
        "Please sign in",
        "unauthenticated",
      );
    const { token } = await readBody(request, acceptInvitationSchema);
    return backend().identity.redeemInvitation(profile.id, token);
  });
}
