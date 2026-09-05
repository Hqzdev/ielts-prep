import { backend } from "@/server/backend";
import { handle } from "@/server/http";
import { requireProfile } from "@/server/identity";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(_, async () => {
    await requireProfile();
    return backend().catalog.task((await params).id);
  });
}
