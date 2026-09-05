import { preppyPreferencesSchema } from "@/domain/preppy";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { VoiceChatService } from "@/server/services/voice-chat";
export const maxDuration = 180;
export async function POST(request: Request) {
  return handle(async () => {
    const profile = await requireProfile();
    const preferences = await readBody(
      request,
      preppyPreferencesSchema.strict(),
    );
    return new VoiceChatService().start(profile, preferences);
  });
}
