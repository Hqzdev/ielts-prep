import type { CatalogStore } from "../ports/practice";

export interface CatalogQuery {
  skill?: string;
  topic?: string;
  format?: string;
  part?: string;
  status?: string;
  q?: string;
  sort?: string;
  page?: number;
}

export class CatalogService {
  constructor(
    private readonly store: CatalogStore,
    private readonly skills?: string[],
  ) {}

  tasks() {
    return this.store.tasks();
  }
  task(id: string) {
    return this.store.task(id);
  }
  catalog(userId: string) {
    return this.store.catalog(userId);
  }

  async search(userId: string, query: CatalogQuery) {
    let items = (await this.store.catalog(userId)).filter(
      (item) => !this.skills || this.skills.includes(item.task.skill),
    );
    for (const key of ["skill", "topic", "format", "part"] as const) {
      if (query[key])
        items = items.filter((item) => String(item.task[key]) === query[key]);
    }
    if (query.status)
      items = items.filter((item) => item.status === query.status);
    if (query.q) {
      const text = query.q.toLowerCase();
      items = items.filter((item) =>
        `${item.task.title} ${item.task.prompt}`.toLowerCase().includes(text),
      );
    }
    if (query.sort === "title")
      items.sort((a, b) => a.task.title.localeCompare(b.task.title));
    else if (query.sort === "recent")
      items.sort((a, b) =>
        (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""),
      );
    else
      items.sort(
        (a, b) =>
          b.task.createdAt.localeCompare(a.task.createdAt) ||
          a.task.id.localeCompare(b.task.id),
      );
    const page = Math.max(1, Math.floor(query.page || 1));
    return {
      items: items.slice((page - 1) * 20, page * 20),
      total: items.length,
      page,
    };
  }
}
