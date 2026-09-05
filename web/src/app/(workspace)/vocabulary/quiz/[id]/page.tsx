import { pageProfile } from "@/server/identity";
import { VocabularyService } from "@/server/services/vocabulary";
import { VocabularyTest } from "@/components/vocabulary";
export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await pageProfile();
  return (
    <VocabularyTest
      initial={await new VocabularyService().quiz(
        profile.id,
        (await params).id,
      )}
    />
  );
}
