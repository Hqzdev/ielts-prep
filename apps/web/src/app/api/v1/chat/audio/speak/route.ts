import { chatAudioSchema } from "@veylo/contracts/schemas/requests";
import { backend } from "@/server/backend";

import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";

export const maxDuration = 180;
export async function POST(request: Request) {
  return handle(request, async () => {
    const profile = await requireProfile();
    const input = await readBody(request, chatAudioSchema);
    return backend().voice.speak(
      profile.id,
      input.threadId,
      input.messageId,
      input,
    );
  });
}
