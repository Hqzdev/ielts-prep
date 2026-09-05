import { handle } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { CatalogRepository } from "@/server/repositories/catalog";

export async function GET(request: Request) {
  return handle(async () => {
    const profile = await requireProfile();
    const query = new URL(request.url).searchParams;
    let items = await new CatalogRepository().catalog(profile.id);
    for (const key of ["skill", "topic", "format", "part"] as const)
      if (query.get(key))
        items = items.filter(
          (item) => String(item.task[key]) === query.get(key),
        );
    if (query.get("status"))
      items = items.filter((item) => item.status === query.get("status"));
    if (query.get("q"))
      items = items.filter((item) =>
        `${item.task.title} ${item.task.prompt}`
          .toLowerCase()
          .includes(query.get("q")!.toLowerCase()),
      );
    if (query.get("sort") === "title")
      items.sort((a, b) => a.task.title.localeCompare(b.task.title));
    else if (query.get("sort") === "recent")
      items.sort((a, b) =>
        (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""),
      );
    else
      items.sort(
        (a, b) =>
          b.task.createdAt.localeCompare(a.task.createdAt) ||
          a.task.id.localeCompare(b.task.id),
      );
    const page = Math.max(1, Number(query.get("page")) || 1);
    return {
      items: items.slice((page - 1) * 20, page * 20),
      total: items.length,
      page,
    };
  });
}
