import { pageProfile } from "@/server/identity";
import { backend } from "@/server/backend";
import { VocabularyTest } from "@/components/vocabulary";
export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await pageProfile();
  return (
    <VocabularyTest
      initial={await backend().vocabulary.quiz(profile.id, (await params).id)}
    />
  );
}
