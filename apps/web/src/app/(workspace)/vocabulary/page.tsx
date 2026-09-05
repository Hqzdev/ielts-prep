import { pageProfile } from "@/server/identity";
import { backend } from "@/server/backend";
import { Vocabulary } from "@/components/vocabulary";
import { config } from "@/server/config";
export default async function VocabularyPage() {
  const profile = await pageProfile();
  return (
    <Vocabulary
      initial={await backend().vocabulary.words(profile.id)}
      userId={profile.id}
      aiAvailable={!!config.geminiKey}
    />
  );
}
