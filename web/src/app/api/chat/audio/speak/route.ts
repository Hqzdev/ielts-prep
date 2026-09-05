import { z } from "zod";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { VoiceChatService } from "@/server/services/voice-chat";
import { preppyPreferencesSchema } from "@/domain/preppy";
export const maxDuration = 180;
export async function POST(request: Request) {
  return handle(async () => {
    const profile = await requireProfile();
    const input = await readBody(
      request,
      preppyPreferencesSchema.extend({
        threadId: z.uuid(),
        messageId: z.uuid(),
      }),
    );
    return new VoiceChatService().speak(
      profile.id,
      input.threadId,
      input.messageId,
      input,
    );
  });
}
