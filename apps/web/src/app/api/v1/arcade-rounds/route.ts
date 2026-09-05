import { backend } from "@/server/backend";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { arcadeStartSchema } from "@veylo/contracts/schemas/arcade";

export async function POST(request: Request) {
  return handle(request, async () =>
    backend().arcade.start(
      (await requireProfile()).id,
      await readBody(request, arcadeStartSchema),
    ),
  );
}
