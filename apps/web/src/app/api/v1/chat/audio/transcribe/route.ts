import { readAudio } from "@/server/read-audio";
import { backend } from "@/server/backend";
import { z } from "zod";
import { handle } from "@/server/http";
import { requireProfile } from "@/server/identity";

export const maxDuration = 180;
export async function POST(request: Request) {
  return handle(request, async () => {
    const profile = await requireProfile();
    const threadId = z
      .uuid()
      .parse(new URL(request.url).searchParams.get("thread"));
    return backend().voice.transcribe(
      profile.id,
      threadId,
      await readAudio(request),
    );
  });
}
