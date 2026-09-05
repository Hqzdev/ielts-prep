import { backend } from "@/server/backend";
import { handle } from "@/server/http";
import { requireProfile } from "@/server/identity";

export async function GET(request: Request) {
  return handle(request, async () =>
    backend().learning.statistics((await requireProfile()).id),
  );
}
