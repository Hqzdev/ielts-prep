import { redirect } from "next/navigation";
import { after } from "next/server";
import { pageProfile } from "@/server/identity";
import { PracticeRepository } from "@/server/repositories/practice";
import { PracticeService } from "@/server/services/practice";
import { dispatchAssessments } from "@/server/services/dispatch";
import { Result } from "@/components/result";
import { AttemptClock } from "@/domain/attempt";
export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await pageProfile();
  const repository = new PracticeRepository();
  let attempt = await repository.get(profile.id, (await params).id);
  if (["in_progress", "paused"].includes(attempt.status)) {
    if (new AttemptClock().expired(attempt)) {
      await new PracticeService().submit(profile.id, attempt.id);
      attempt = await repository.get(profile.id, attempt.id);
      after(dispatchAssessments);
    } else redirect(`/practice/${attempt.id}`);
  }
  const assessment = await repository.assessment(profile.id, attempt.id);
  const parent = attempt.parentAttemptId
    ? await repository.assessment(profile.id, attempt.parentAttemptId)
    : null;
  return (
    <Result
      initialAttempt={attempt}
      initialAssessment={assessment}
      parentAssessment={parent}
    />
  );
}
