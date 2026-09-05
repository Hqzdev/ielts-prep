import {
  speakingArcadeStartSchema,
  speakingArcadeFinishSchema,
} from "@veylo/contracts/schemas/requests";
import { z } from "zod";
import { backend } from "@/server/backend";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { AppError } from "@veylo/backend/domain/errors";

type Context = { params: Promise<{ action?: string[] }> };

export async function POST(request: Request, { params }: Context) {
  return handle(request, async () => {
    const profile = await requireProfile();
    const { action } = await params;
    if (!action?.length) {
      const { taskId } = await readBody(request, speakingArcadeStartSchema);
      return backend().speakingArcade.start(profile.id, taskId);
    }
    const id = z.uuid().parse(action[0]);
    if (action[1] !== "finish")
      throw new AppError("NOT_FOUND", "Action not found", "not_found");
    const body = await readBody(request, speakingArcadeFinishSchema);
    return backend().speakingArcade.finish(profile.id, id, body);
  });
}
