import {
  emptyRequestSchema,
  moveStudySessionSchema,
} from "@veylo/contracts/schemas/requests";
import { backend } from "@/server/backend";
import { z } from "zod";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";

type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, { params }: Context) {
  return handle(request, async () => {
    const profile = await requireProfile();
    await readBody(request, emptyRequestSchema);
    return backend().learning.start(
      profile.id,
      z.uuid().parse((await params).id),
    );
  });
}
export async function PATCH(request: Request, { params }: Context) {
  return handle(request, async () => {
    const profile = await requireProfile();
    const { date } = await readBody(request, moveStudySessionSchema);
    return backend().learning.move(
      profile.id,
      z.uuid().parse((await params).id),
      date,
    );
  });
}
