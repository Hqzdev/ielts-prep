import { pageProfile } from "@/server/identity";
import { VocabularyService } from "@/server/services/vocabulary";
import { Vocabulary } from "@/components/vocabulary";
import { config } from "@/server/config";
export default async function VocabularyPage() {
  const profile = await pageProfile();
  return (
    <Vocabulary
      initial={await new VocabularyService().words(profile.id)}
      userId={profile.id}
      aiAvailable={!!config.geminiKey}
    />
  );
}
