import { requireAdmin } from "@/server/identity";
import { backend } from "@/server/backend";
import { Administration } from "@/components/administration";
export default async function AdminPage() {
  const profile = await requireAdmin();
  return (
    <Administration data={await backend().administration.overview(profile)} />
  );
}
