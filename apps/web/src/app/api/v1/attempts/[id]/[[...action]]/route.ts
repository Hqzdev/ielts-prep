import {
  saveAttemptSchema,
  emptyRequestSchema,
} from "@veylo/contracts/schemas/requests";
import { backend } from "@/server/backend";
import { after } from "next/server";

import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";

import { AppError } from "@veylo/backend/domain/errors";
import { dispatchAssessments } from "@/server/services/dispatch";

type Context = { params: Promise<{ id: string; action?: string[] }> };
export async function GET(_: Request, { params }: Context) {
  return handle(_, async () => {
    const profile = await requireProfile();
    const { id, action } = await params;
    if (action?.[0] && action[0] !== "result")
      throw new AppError("NOT_FOUND", "Page not found", "not_found");
    const result = await backend().practice.result(profile.id, id);
    if (result.assessment?.status === "queued") after(dispatchAssessments);
    return result;
  });
}
export async function PATCH(request: Request, { params }: Context) {
  return handle(request, async () => {
    const profile = await requireProfile();
    const { id, action } = await params;
    if (action?.length)
      throw new AppError("NOT_FOUND", "Action not found", "not_found");
    const body = await readBody(request, saveAttemptSchema);
    return backend().practice.save(
      profile.id,
      id,
      body.revision,
      body.answer,
      body.action,
    );
  });
}
export async function POST(request: Request, { params }: Context) {
  return handle(request, async () => {
    const profile = await requireProfile();
    const { id, action } = await params;
    await readBody(request, emptyRequestSchema);
    if (action?.[0] === "revisions") {
      return backend().practice.revise(profile.id, id);
    }
    const service = backend().practice;
    const assessment =
      action?.[0] === "submit"
        ? await service.submit(profile.id, id)
        : action?.[0] === "retry-assessment"
          ? await service.retry(profile.id, id)
          : null;
    if (!assessment)
      throw new AppError("NOT_FOUND", "Action not found", "not_found");
    after(dispatchAssessments);
    return assessment;
  });
}
