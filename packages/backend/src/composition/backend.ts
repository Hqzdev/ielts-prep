import { createNativeAi, type NativeAiSettings } from "./gigachat";
import { ObservedAiSource } from "../infrastructure/ai/observed-provider";
import { CatalogService } from "../application/services/catalog";
import { SpeakingArcadeService } from "../application/services/speaking-arcade";
import { SupabaseSpeakingArcadeStore } from "../infrastructure/persistence/speaking-arcade";
import { createTooling } from "./tooling";
import { AdministrationService } from "../application/services/administration";
import { SupabaseAdministrationStore } from "../infrastructure/persistence/administration";
import { IdentityService } from "../application/services/identity";
import { SupabaseIdentityStore } from "../infrastructure/persistence/identity";
import { AssessmentService } from "../application/services/assessment";
import { SupabaseEvaluationStore } from "../infrastructure/persistence/assessment";
import { GeminiFailurePolicy } from "../infrastructure/ai/failure-policy";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../domain/errors";
import type { AssessmentPolicy } from "../application/ports/runtime";
import type { AiProviderSource } from "../application/ports/ai";
import { PracticeService } from "../application/services/practice";
import { LearningService } from "../application/services/learning";
import { DailyStreakService } from "../application/services/daily-streak";
import { VocabularyService } from "../application/services/vocabulary";
import { ArcadeProgressService } from "../application/services/arcade-progress";
import { TutorService } from "../application/services/tutor";
import { VoiceChatService } from "../application/services/voice-chat";
import { AudioService } from "../application/services/audio";
import { SpeechService } from "../application/services/speech";
import { ConversationFeedbackService } from "../application/services/conversation-feedback";
import { WordAssistance } from "../application/services/word-assistance";
import { PracticeRepository } from "../infrastructure/persistence/practice";
import { CatalogRepository } from "../infrastructure/persistence/catalog";
import { SupabaseLearningStore } from "../infrastructure/persistence/learning";
import { SupabaseVocabularyStore } from "../infrastructure/persistence/vocabulary";
import { SupabaseArcadeStore } from "../infrastructure/persistence/arcade";
import { SupabaseRecordingAvailability } from "../infrastructure/persistence/recording-availability";
import {
  SupabaseConversationStore,
  SupabaseUsageQuota,
} from "../infrastructure/persistence/conversations";
import {
  SupabaseAudioStorage,
  SupabaseRecordingStore,
  SupabaseSpeechAssetStore,
} from "../infrastructure/persistence/audio";
import {
  SystemClock,
  SecureIdentifiers,
  SecureRandom,
  NodeContentEncoding,
} from "../infrastructure/runtime";
import { GeminiGateway } from "../infrastructure/ai/gateway";

export interface BackendSettings extends AssessmentPolicy, NativeAiSettings {
  readonly supabaseUrl: string;
  readonly supabaseSecretKey: string;
  readonly databaseReady: boolean;
  readonly appUrl: string;
  readonly betaLimit: number;
  readonly geminiKey: string;
  readonly textModel: string;
  readonly audioModel: string;
  readonly ttsModel: string;
  readonly voice: string;
  readonly dailyChatLimit: number;
}

function database(settings: BackendSettings) {
  if (!settings.databaseReady)
    throw new AppError(
      "SETUP_REQUIRED",
      "Application storage has not been configured yet",
      "unavailable",
    );
  return createClient(settings.supabaseUrl, settings.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createBackend(
  settings: BackendSettings,
  db: SupabaseClient = database(settings),
  ai: AiProviderSource = new ObservedAiSource(
    new GeminiGateway({
      key: settings.geminiKey,
      textModel: settings.textModel,
      audioModel: settings.audioModel,
      ttsModel: settings.ttsModel,
      voice: settings.voice,
    }),
  ),
) {
  const clock = new SystemClock();
  const nativeAI = createNativeAi(settings, db);
  const ids = new SecureIdentifiers();
  const encoding = new NodeContentEncoding();
  const attempts = new PracticeRepository(db);
  const catalog = new CatalogRepository(db);
  const learningStore = new SupabaseLearningStore(db);
  const learning = new LearningService(learningStore, attempts, catalog, clock);
  const conversationStore = new SupabaseConversationStore(
    db,
    "gemini",
    settings.textModel,
  );
  const quota = new SupabaseUsageQuota(db);
  const tutor = new TutorService(
    conversationStore,
    attempts,
    learning,
    ai,
    quota,
    ids,
    settings.dailyChatLimit,
  );
  const storage = new SupabaseAudioStorage(db);
  const speech = new SpeechService(
    new SupabaseSpeechAssetStore(db),
    storage,
    ai,
    encoding,
    settings,
  );
  const tooling = createTooling(db, settings.appUrl);
  return {
    nativeAI,
    administration: new AdministrationService(
      new SupabaseAdministrationStore(db),
      tooling.invitations,
      tooling.content,
    ),
    assessment: new AssessmentService(
      new SupabaseEvaluationStore(db),
      attempts,
      new SupabaseRecordingStore(db),
      storage,
      ai,
      settings,
      new GeminiFailurePolicy(),
      clock,
      encoding,
      nativeAI,
    ),
    identity: new IdentityService(
      new SupabaseIdentityStore(db),
      encoding,
      settings.betaLimit,
    ),
    invitations: tooling.invitations,
    speakingArcade: new SpeakingArcadeService(
      new SupabaseSpeakingArcadeStore(db),
      catalog,
      clock,
    ),
    attempts,
    catalog: new CatalogService(catalog),
    learning,
    tutor,
    practice: new PracticeService(
      attempts,
      catalog,
      new SupabaseRecordingAvailability(db),
      settings,
      clock,
    ),
    streak: new DailyStreakService(learningStore, clock),
    vocabulary: new VocabularyService(
      new SupabaseVocabularyStore(db),
      ids,
      new SecureRandom(),
    ),
    arcade: new ArcadeProgressService(new SupabaseArcadeStore(db), clock),
    voice: new VoiceChatService(
      conversationStore,
      tutor,
      speech,
      ai,
      quota,
      ids,
      encoding,
      settings.dailyChatLimit,
    ),
    audio: new AudioService(
      new SupabaseRecordingStore(db),
      storage,
      attempts,
      speech,
      clock,
      ids,
    ),
    feedback: new ConversationFeedbackService(
      tutor,
      ai,
      quota,
      ids,
      settings.dailyChatLimit,
    ),
    wordAssistance: new WordAssistance(ai, quota, ids, settings.dailyChatLimit),
  };
}
