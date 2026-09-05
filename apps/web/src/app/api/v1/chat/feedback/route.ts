import { chatFeedbackRequestSchema } from "@veylo/contracts/schemas/requests";
import { backend } from "@/server/backend";

import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";

export const maxDuration = 180;
export async function POST(request: Request) {
  return handle(request, async () => {
    const profile = await requireProfile();
    const { threadId } = await readBody(request, chatFeedbackRequestSchema);
    return backend().feedback.analyse(profile.id, threadId);
  });
}
