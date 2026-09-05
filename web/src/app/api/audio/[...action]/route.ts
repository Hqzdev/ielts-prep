import { z } from "zod";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { AudioService } from "@/server/services/audio";
import { CatalogRepository } from "@/server/repositories/catalog";
import { AppError } from "@/domain/errors";
type Context = { params: Promise<{ action: string[] }> };
export async function POST(request: Request, { params }: Context) {
  return handle(async () => {
    const profile = await requireProfile();
    const { action } = await params;
    const service = new AudioService();
    if (action[0] === "upload-ticket") {
      const body = await readBody(
        request,
        z.object({
          attemptId: z.uuid(),
          questionIndex: z.number().int().nonnegative(),
          bytes: z.number().int().min(44).max(20971520),
        }),
      );
      return service.ticket(
        profile.id,
        body.attemptId,
        body.questionIndex,
        body.bytes,
      );
    }
    if (action[0] === "question") {
      const body = await readBody(
        request,
        z.object({
          taskId: z.string(),
          questionIndex: z.number().int().nonnegative(),
        }),
      );
      const task = await new CatalogRepository().task(body.taskId);
      const question = task.speakingQuestions[body.questionIndex];
      if (!question) throw new AppError("NOT_FOUND", "Question not found", 404);
      return service.question(question);
    }
    await readBody(request, z.object({}));
    if (action[1] === "complete")
      return service.complete(profile.id, z.uuid().parse(action[0]));
    throw new AppError("NOT_FOUND", "Action not found", 404);
  });
}
export async function GET(_: Request, { params }: Context) {
  return handle(async () => {
    const profile = await requireProfile();
    return new AudioService().playback(
      profile.id,
      z.uuid().parse((await params).action[0]),
    );
  });
}
export async function DELETE(request: Request, { params }: Context) {
  return handle(async () => {
    const profile = await requireProfile();
    await readBody(request, z.object({}));
    return new AudioService().remove(
      profile.id,
      z.uuid().parse((await params).action[0]),
    );
  });
}
