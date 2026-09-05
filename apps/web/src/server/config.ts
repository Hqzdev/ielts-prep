import "server-only";

export class AppConfig {
  readonly supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  readonly supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";
  readonly supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "";
  readonly appUrl = process.env.APP_URL ?? "http://127.0.0.1:3000";
  readonly geminiKey = process.env.GEMINI_API_KEY ?? "";
  readonly textModel = process.env.GEMINI_TEXT_MODEL ?? "gemini-3.5-flash";
  readonly audioModel = process.env.GEMINI_AUDIO_MODEL ?? "gemini-3.5-flash";
  readonly ttsModel =
    process.env.GEMINI_TTS_MODEL ?? "gemini-3.1-flash-tts-preview";
  readonly voice = process.env.GEMINI_VOICE ?? "Kore";
  readonly writingEnabled = process.env.ASSESSMENT_WRITING_ENABLED === "true";
  readonly speakingEnabled = process.env.ASSESSMENT_SPEAKING_ENABLED === "true";
  readonly betaLimit = Number(process.env.BETA_USER_LIMIT ?? 50);
  readonly dailyAssessmentLimit = Number(
    process.env.AI_ASSESSMENTS_PER_DAY ?? 5,
  );
  readonly dailyChatLimit = Number(process.env.AI_CHAT_MESSAGES_PER_DAY ?? 30);

  get databaseReady(): boolean {
    return (
      !!this.supabaseUrl &&
      !!this.supabasePublishableKey &&
      !!this.supabaseSecretKey
    );
  }
  get localDevelopment(): boolean {
    return (
      process.env.NODE_ENV === "development" &&
      /^http:\/\/(127\.0\.0\.1|localhost):/.test(this.supabaseUrl)
    );
  }
  canAssess(skill: "writing" | "speaking"): boolean {
    return (
      !!this.geminiKey &&
      (skill === "writing" ? this.writingEnabled : this.speakingEnabled)
    );
  }
}

export const config = new AppConfig();
