import { backend } from "@/server/backend";
import { z } from "zod";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { arcadeFinishSchema } from "@veylo/contracts/schemas/arcade";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(request, async () =>
    backend().arcade.finish(
      (await requireProfile()).id,
      z.uuid().parse((await params).id),
      await readBody(request, arcadeFinishSchema),
    ),
  );
}
