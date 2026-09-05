import { z } from "zod";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { LearningService } from "@/server/services/learning";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, { params }: Context) {
  return handle(async () => {
    const profile = await requireProfile();
    await readBody(request, z.object({}));
    return new LearningService().start(
      profile.id,
      z.uuid().parse((await params).id),
    );
  });
}
export async function PATCH(request: Request, { params }: Context) {
  return handle(async () => {
    const profile = await requireProfile();
    const { date } = await readBody(request, z.object({ date: z.iso.date() }));
    return new LearningService().move(
      profile.id,
      z.uuid().parse((await params).id),
      date,
    );
  });
}
