import { chatRequestSchema } from "@veylo/contracts/schemas/requests";
import { backend } from "@/server/backend";
import { z } from "zod";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";

export const maxDuration = 180;
export async function POST(request: Request) {
  return handle(request, async () =>
    backend().tutor.respond(
      await requireProfile(),
      await readBody(request, chatRequestSchema),
    ),
  );
}
export async function GET(request: Request) {
  return handle(request, async () => {
    const profile = await requireProfile();
    const threadId = new URL(request.url).searchParams.get("thread");
    const service = backend().tutor;
    return threadId
      ? service.messages(profile.id, z.uuid().parse(threadId))
      : service.threads(profile.id);
  });
}
