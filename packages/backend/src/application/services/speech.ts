import type { PreppyPreferences } from "../../domain/preppy";
import type {
  AudioStorage,
  SpeechAssetStore,
  SpeechSettings,
} from "../ports/audio";
import type { ContentEncoding } from "../ports/runtime";
import type { AiProviderSource } from "../ports/ai";

export class SpeechService {
  constructor(
    private readonly store: SpeechAssetStore,
    private readonly storage: AudioStorage,
    private readonly ai: AiProviderSource,
    private readonly encoding: ContentEncoding,
    private readonly settings: SpeechSettings,
  ) {}

  async question(text: string) {
    const key = this.encoding.fingerprint(
      `${this.settings.ttsModel}|${this.settings.voice}|${text}`,
    );
    return this.synthesize(key, `questions/${key}.wav`, text, 1800);
  }

  async reply(
    userId: string,
    messageId: string,
    text: string,
    preferences: PreppyPreferences,
  ) {
    const key = this.encoding.fingerprint(
      `${userId}|${messageId}|${this.settings.ttsModel}|${this.settings.voice}|${preferences.personality}|${preferences.explicit}|${text}`,
    );
    return this.synthesize(
      key,
      `spark/${userId}/${key}.wav`,
      text,
      300,
      preferences,
    );
  }

  private async synthesize(
    key: string,
    path: string,
    text: string,
    seconds: number,
    preferences?: PreppyPreferences,
  ) {
    if (!(await this.store.cached(key))) {
      const audio = await this.ai.provider().speak(text, preferences);
      await this.storage.upload("examiner", path, audio);
      await this.store.save(key, path, this.settings.ttsModel);
    }
    return { url: await this.storage.signedUrl("examiner", path, seconds) };
  }
}
