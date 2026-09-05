import type { AiProviderSource } from "../../application/ports/ai";
import { GeminiProvider, type GeminiSettings } from "./gemini";

export class GeminiGateway implements AiProviderSource {
  constructor(private readonly settings: GeminiSettings) {}

  get available() {
    return !!this.settings.key;
  }

  provider() {
    return new GeminiProvider(this.settings);
  }
}
