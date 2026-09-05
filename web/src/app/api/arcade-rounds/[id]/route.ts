import { z } from "zod";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";
import {
  ArcadeProgressService,
  arcadeFinishSchema,
} from "@/server/services/arcade-progress";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () =>
    new ArcadeProgressService().finish(
      (await requireProfile()).id,
      z.uuid().parse((await params).id),
      await readBody(request, arcadeFinishSchema),
    ),
  );
}
