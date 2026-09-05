import { after } from "next/server";
import { z } from "zod";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { PracticeRepository } from "@/server/repositories/practice";
import { PracticeService } from "@/server/services/practice";
import { answerSchema, AttemptClock } from "@/domain/attempt";
import { AppError } from "@/domain/errors";
import { dispatchAssessments } from "@/server/services/dispatch";

type Context = { params: Promise<{ id: string; action?: string[] }> };
export async function GET(_: Request, { params }: Context) {
  return handle(async () => {
    const profile = await requireProfile();
    const { id, action } = await params;
    const repository = new PracticeRepository();
    let attempt = await repository.get(profile.id, id);
    if (
      new AttemptClock().expired(attempt) &&
      ["in_progress", "paused"].includes(attempt.status)
    ) {
      await new PracticeService().submit(profile.id, id);
      attempt = await repository.get(profile.id, id);
      after(dispatchAssessments);
    }
    if (action?.[0] && action[0] !== "result")
      throw new AppError("NOT_FOUND", "Page not found", 404);
    const assessment = await repository.assessment(profile.id, id);
    return { attempt, assessment };
  });
}
export async function PATCH(request: Request, { params }: Context) {
  return handle(async () => {
    const profile = await requireProfile();
    const { id, action } = await params;
    if (action?.length)
      throw new AppError("NOT_FOUND", "Action not found", 404);
    const body = await readBody(
      request,
      z.object({
        revision: z.number().int().nonnegative(),
        answer: answerSchema,
        action: z.enum(["pause", "resume"]).optional(),
      }),
    );
    return new PracticeService().save(
      profile.id,
      id,
      body.revision,
      body.answer,
      body.action,
    );
  });
}
export async function POST(request: Request, { params }: Context) {
  return handle(async () => {
    const profile = await requireProfile();
    const { id, action } = await params;
    await readBody(request, z.object({}));
    if (action?.[0] === "revisions") {
      const repository = new PracticeRepository();
      const original = await repository.get(profile.id, id);
      return repository.create(profile.id, original.taskId, "practice", id);
    }
    const service = new PracticeService();
    const assessment =
      action?.[0] === "submit"
        ? await service.submit(profile.id, id)
        : action?.[0] === "retry-assessment"
          ? await service.retry(profile.id, id)
          : null;
    if (!assessment) throw new AppError("NOT_FOUND", "Action not found", 404);
    after(dispatchAssessments);
    return assessment;
  });
}
