import { createAttemptSchema } from "@veylo/contracts/schemas/requests";
import { backend } from "@/server/backend";

import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";

export async function POST(request: Request) {
  return handle(request, async () => {
    const profile = await requireProfile();
    const body = await readBody(request, createAttemptSchema);
    return backend().attempts.create(profile.id, body.taskId, body.mode);
  });
}
