import { CatalogService } from "../application/services/catalog";
import { createClient } from "@supabase/supabase-js";
import { createBackend, type BackendSettings } from "./backend";
import {
  SupabaseNativeStore,
  SupabaseSprintStore,
} from "../infrastructure/persistence/native";
import { SupabaseVocabularyStore } from "../infrastructure/persistence/vocabulary";
import { CatalogRepository } from "../infrastructure/persistence/catalog";
import {
  SupabaseConversationStore,
  SupabaseUsageQuota,
} from "../infrastructure/persistence/conversations";
import { SystemClock, SecureIdentifiers } from "../infrastructure/runtime";
import { TutorService } from "../application/services/tutor";
import { WordAssistance } from "../application/services/word-assistance";
import { ConversationFeedbackService } from "../application/services/conversation-feedback";
import { NativeLearningService } from "../application/services/native-learning";
import { NativeSprintService } from "../application/services/native-sprint";
import {
  NativePracticeService,
  NativeTutorService,
} from "../application/services/native-practice";
import { AppError } from "../domain/errors";

export function createNativeBackend(settings: BackendSettings) {
  if (!settings.databaseReady)
    throw new AppError(
      "SETUP_REQUIRED",
      "The server is not configured",
      "unavailable",
    );
  const db = createClient(settings.supabaseUrl, settings.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const common = createBackend(settings, db);
  const store = new SupabaseNativeStore(db);
  const catalog = new CatalogRepository(db);
  const quota = new SupabaseUsageQuota(db);
  const ids = new SecureIdentifiers();
  const tutor = new TutorService(
    new SupabaseConversationStore(
      db,
      "gigachat",
      settings.nativeTextModel ?? "GigaChat-2-Pro",
    ),
    common.attempts,
    common.learning,
    common.nativeAI,
    quota,
    ids,
    settings.dailyChatLimit,
  );
  return {
    common,
    store,
    catalog: new CatalogService(catalog, ["reading", "writing"]),
    learning: new NativeLearningService(
      store,
      catalog,
      common.attempts,
      common.learning,
      common.streak,
      new SystemClock(),
    ),
    sprint: new NativeSprintService(
      new SupabaseSprintStore(db),
      new SupabaseVocabularyStore(db),
      common.vocabulary,
    ),
    practice: new NativePracticeService(
      store,
      common.attempts,
      catalog,
      common.practice,
      settings.nativeWritingModel ?? "GigaChat-2-Max",
      settings.nativeRecordingTesters ?? [],
    ),
    tutor: new NativeTutorService(tutor, common.attempts),
    conversations: tutor,
    wordAssistance: new WordAssistance(
      common.nativeAI,
      quota,
      ids,
      settings.dailyChatLimit,
    ),
    feedback: new ConversationFeedbackService(
      tutor,
      common.nativeAI,
      quota,
      ids,
      settings.dailyChatLimit,
    ),
    capabilities: (userId: string) => ({
      skills: ["reading", "writing"] as const,
      textAI: common.nativeAI.available,
      writingAssessment:
        common.nativeAI.available && !!settings.nativeWritingEnabled,
      speakingRecording:
        settings.nativeRecordingTesters?.includes(userId) ?? false,
      voiceAI: false as const,
      fullExam: false as const,
    }),
  };
}
