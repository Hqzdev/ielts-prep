import { requireAdmin } from "@/server/identity";
import { AdministrationService } from "@/server/services/administration";
import { Administration } from "@/components/administration";
export default async function AdminPage() {
  await requireAdmin();
  return <Administration data={await new AdministrationService().overview()} />;
}
