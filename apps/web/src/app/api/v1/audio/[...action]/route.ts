import {
  uploadTicketSchema,
  questionAudioSchema,
  emptyRequestSchema,
} from "@veylo/contracts/schemas/requests";
import { backend } from "@/server/backend";
import { z } from "zod";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";

import { AppError } from "@veylo/backend/domain/errors";
type Context = { params: Promise<{ action: string[] }> };
export async function POST(request: Request, { params }: Context) {
  return handle(request, async () => {
    const profile = await requireProfile();
    const { action } = await params;
    const service = backend().audio;
    if (action[0] === "upload-ticket") {
      const body = await readBody(request, uploadTicketSchema);
      return service.ticket(
        profile.id,
        body.attemptId,
        body.questionIndex,
        body.bytes,
      );
    }
    if (action[0] === "question") {
      const body = await readBody(request, questionAudioSchema);
      const task = await backend().catalog.task(body.taskId);
      const question = task.speakingQuestions[body.questionIndex];
      if (!question)
        throw new AppError("NOT_FOUND", "Question not found", "not_found");
      return service.question(question);
    }
    await readBody(request, emptyRequestSchema);
    if (action[1] === "complete")
      return service.complete(profile.id, z.uuid().parse(action[0]));
    throw new AppError("NOT_FOUND", "Action not found", "not_found");
  });
}
export async function GET(_: Request, { params }: Context) {
  return handle(_, async () => {
    const profile = await requireProfile();
    return backend().audio.playback(
      profile.id,
      z.uuid().parse((await params).action[0]),
    );
  });
}
export async function DELETE(request: Request, { params }: Context) {
  return handle(request, async () => {
    const profile = await requireProfile();
    await readBody(request, emptyRequestSchema);
    return backend().audio.remove(
      profile.id,
      z.uuid().parse((await params).action[0]),
    );
  });
}
