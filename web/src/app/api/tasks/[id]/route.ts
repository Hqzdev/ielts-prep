import { handle } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { CatalogRepository } from "@/server/repositories/catalog";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    await requireProfile();
    return new CatalogRepository().task((await params).id);
  });
}
