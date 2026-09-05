import { z } from "zod";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { TutorService } from "@/server/services/tutor";
import { preppyPreferencesSchema } from "@/domain/preppy";
export const maxDuration = 180;
export async function POST(request: Request) {
  return handle(async () =>
    new TutorService().respond(
      await requireProfile(),
      await readBody(
        request,
        preppyPreferencesSchema
          .extend({
            content: z.string().trim().min(1).max(6000).optional(),
            retryAssistantId: z.uuid().optional(),
            threadId: z.uuid().optional(),
            attemptId: z.uuid().optional(),
          })
          .refine(
            (input) =>
              Boolean(input.content) !== Boolean(input.retryAssistantId) &&
              (!input.retryAssistantId || Boolean(input.threadId)),
            "Provide a message or an interrupted reply to retry",
          ),
      ),
    ),
  );
}
export async function GET(request: Request) {
  return handle(async () => {
    const profile = await requireProfile();
    const threadId = new URL(request.url).searchParams.get("thread");
    const service = new TutorService();
    return threadId
      ? service.messages(profile.id, z.uuid().parse(threadId))
      : service.threads(profile.id);
  });
}
