import { z } from "zod";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { VoiceChatService } from "@/server/services/voice-chat";

export const maxDuration = 180;

export async function POST(request: Request) {
  return handle(async () => {
    const profile = await requireProfile();
    await readBody(request, z.object({}).strict(), 100);
    return new VoiceChatService().welcome(profile.id);
  });
}
