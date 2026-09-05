import { notFound } from "next/navigation";
import { skillSchema } from "@/domain/task";
import { pageProfile } from "@/server/identity";
import { CatalogRepository } from "@/server/repositories/catalog";
import { Catalog } from "@/components/catalog";
export default async function CatalogPage({
  params,
}: {
  params: Promise<{ skill: string }>;
}) {
  const parsed = skillSchema.safeParse((await params).skill);
  if (!parsed.success) notFound();
  const profile = await pageProfile();
  const items = (await new CatalogRepository().catalog(profile.id)).filter(
    (item) => item.task.skill === parsed.data,
  );
  return <Catalog items={items} skill={parsed.data} />;
}
