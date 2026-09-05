import { redirect } from "next/navigation";
import { pageProfile } from "@/server/identity";
import { PracticeRepository } from "@/server/repositories/practice";
import { PracticeWorkspace } from "@/components/practice-workspace";
import { config } from "@/server/config";
export default async function PracticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await pageProfile();
  const attempt = await new PracticeRepository().get(
    profile.id,
    (await params).id,
  );
  if (["submitted", "completed"].includes(attempt.status))
    redirect(`/results/${attempt.id}`);
  return (
    <PracticeWorkspace
      initial={attempt}
      aiAvailable={
        attempt.taskSnapshot.skill === "reading" ||
        config.canAssess(attempt.taskSnapshot.skill)
      }
    />
  );
}
