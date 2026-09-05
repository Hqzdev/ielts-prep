import { backend } from "@/server/backend";
import { handle } from "@/server/http";
import { requireProfile } from "@/server/identity";

export async function GET(request: Request) {
  return handle(request, async () => {
    const profile = await requireProfile();
    const query = new URL(request.url).searchParams;
    return backend().catalog.search(profile.id, {
      ...Object.fromEntries(query),
      page: Number(query.get("page")) || 1,
    });
  });
}
