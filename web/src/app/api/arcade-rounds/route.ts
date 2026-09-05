import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";
import {
  ArcadeProgressService,
  arcadeStartSchema,
} from "@/server/services/arcade-progress";

export async function POST(request: Request) {
  return handle(async () =>
    new ArcadeProgressService().start(
      (await requireProfile()).id,
      await readBody(request, arcadeStartSchema),
    ),
  );
}
