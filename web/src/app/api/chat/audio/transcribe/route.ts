import { z } from "zod";
import { handle } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { VoiceChatService } from "@/server/services/voice-chat";
export const maxDuration = 180;
export async function POST(request: Request) {
  return handle(async () => {
    const profile = await requireProfile();
    const threadId = z
      .uuid()
      .parse(new URL(request.url).searchParams.get("thread"));
    return new VoiceChatService().transcribe(profile.id, threadId, request);
  });
}
