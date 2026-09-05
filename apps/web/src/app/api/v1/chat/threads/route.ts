import { handle } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { backend } from "@/server/backend";

export async function GET(request: Request) {
  return handle(request, async () =>
    backend().tutor.threads((await requireProfile()).id),
  );
}
