import { backend } from "@/server/backend";
import { z } from "zod";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";

export const maxDuration = 180;

export async function POST(request: Request) {
  return handle(request, async () => {
    const profile = await requireProfile();
    await readBody(request, z.object({}).strict(), 100);
    return backend().voice.welcome(profile.id);
  });
}
