import { z } from "zod";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { PracticeRepository } from "@/server/repositories/practice";
export async function POST(request: Request) {
  return handle(async () => {
    const profile = await requireProfile();
    const body = await readBody(
      request,
      z.object({ taskId: z.string(), mode: z.enum(["practice", "strict"]) }),
    );
    return new PracticeRepository().create(profile.id, body.taskId, body.mode);
  });
}
