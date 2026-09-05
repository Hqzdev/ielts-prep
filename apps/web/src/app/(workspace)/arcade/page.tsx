import { Arcade } from "@/components/arcade";
import { pageProfile } from "@/server/identity";

export default async function ArcadePage() {
  await pageProfile();
  return <Arcade />;
}
