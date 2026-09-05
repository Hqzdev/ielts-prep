import { z } from "zod";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { ConversationFeedbackService } from "@/server/services/conversation-feedback";
export const maxDuration = 180;
export async function POST(request: Request) {
  return handle(async () => {
    const profile = await requireProfile();
    const { threadId } = await readBody(
      request,
      z.object({ threadId: z.uuid() }),
    );
    return new ConversationFeedbackService().analyse(profile.id, threadId);
  });
}
