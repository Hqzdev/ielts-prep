import { deleteAccountSchema } from "@veylo/contracts/schemas/requests";

import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { backend } from "@/server/backend";
import { profileInputSchema } from "@veylo/contracts/schemas/profile";
import { sessionClient } from "@/server/supabase";

export async function GET(request: Request) {
  return handle(request, requireProfile);
}

export async function PATCH(request: Request) {
  return handle(request, async () => {
    const profile = await requireProfile();
    return backend().identity.save(
      profile.id,
      await readBody(request, profileInputSchema),
    );
  });
}

export async function DELETE(request: Request) {
  return handle(request, async () => {
    const profile = await requireProfile();
    await readBody(request, deleteAccountSchema);
    const result = await backend().identity.deleteAccount(profile.id);
    await (await sessionClient()).auth.signOut();
    return result;
  });
}
