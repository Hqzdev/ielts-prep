import { backend } from "@/server/backend";
import { notFound } from "next/navigation";
import { skillSchema } from "@veylo/contracts/schemas/task";
import { pageProfile } from "@/server/identity";

import { Catalog } from "@/components/catalog";
export default async function CatalogPage({
  params,
}: {
  params: Promise<{ skill: string }>;
}) {
  const parsed = skillSchema.safeParse((await params).skill);
  if (!parsed.success) notFound();
  const profile = await pageProfile();
  const items = (await backend().catalog.catalog(profile.id)).filter(
    (item) => item.task.skill === parsed.data,
  );
  return <Catalog items={items} skill={parsed.data} />;
}
