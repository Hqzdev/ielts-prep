import { backend } from "@/server/backend";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { pageProfile } from "@/server/identity";

import { dispatchAssessments } from "@/server/services/dispatch";
import { Result } from "@/components/result";
import { AttemptClock } from "@veylo/backend/domain/attempt";
export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await pageProfile();
  const repository = backend().attempts;
  let attempt = await repository.get(profile.id, (await params).id);
  if (["in_progress", "paused"].includes(attempt.status)) {
    if (new AttemptClock().expired(attempt)) {
      await backend().practice.submit(profile.id, attempt.id);
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
