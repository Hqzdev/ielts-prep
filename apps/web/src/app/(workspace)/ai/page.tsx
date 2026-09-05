import { PreppyExperience } from "@/components/preppy-experience";
import { pageProfile } from "@/server/identity";

export default async function TutorPage() {
  await pageProfile();
  return <PreppyExperience />;
}
