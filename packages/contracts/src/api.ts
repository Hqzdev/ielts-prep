import { z } from "zod";
import * as requests from "./schemas/requests";
import * as responses from "./schemas/responses";
import { taskSchema } from "./schemas/task";
import { profileInputSchema } from "./schemas/profile";
import { wordInputSchema } from "./schemas/vocabulary";
import {
  preppyPreferencesSchema,
  preppyExpressionSchema,
  preppyPositionSchema,
} from "./schemas/preppy";
import { conversationFeedbackSchema } from "./schemas/conversation-feedback";
import { arcadeStartSchema, arcadeFinishSchema } from "./schemas/arcade";

const saved = z.object({ saved: z.boolean() });
const identifier = z.object({ id: z.string() });
const url = z.object({ url: z.string() });
const deleted = z.object({ deleted: z.boolean() });
const empty = requests.emptyRequestSchema;

export const chatEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("thread"),
    threadId: z.string(),
    assistantId: z.string(),
  }),
  z.object({
    type: z.literal("expression"),
    expression: preppyExpressionSchema,
    position: preppyPositionSchema,
  }),
  z.object({ type: z.literal("token"), text: z.string() }),
  z.object({ type: z.literal("error"), message: z.string() }),
  z.object({ type: z.literal("done"), status: z.string() }),
]);

export interface ApiOperation {
  id: string;
  method: "get" | "post" | "patch" | "delete";
  path: string;
  response: z.ZodType;
  body?: z.ZodType;
  query?: Record<string, { required?: boolean; schema: z.ZodType }>;
  stream?: boolean;
  audio?: boolean;
  description: string;
}

export const apiOperations: ApiOperation[] = [
  {
    id: "getProfile",
    method: "get",
    path: "/profile",
    response: responses.profileSchema,
    description:
      "Read the authenticated member profile, including onboarding state and study preferences. A new profile may have an empty name before onboarding.",
  },
  {
    id: "listChatThreads",
    method: "get",
    path: "/chat/threads",
    response: z.array(responses.chatThreadSchema),
    description: "List up to 100 owned threads in most-recent-first order.",
  },
  {
    id: "listChatMessages",
    method: "get",
    path: "/chat/threads/{id}/messages",
    response: z.array(responses.chatMessageSchema),
    description:
      "Read up to 300 messages in the owned thread in chronological order.",
  },
  {
    id: "listTasks",
    method: "get",
    path: "/tasks",
    response: responses.catalogPageSchema,
    query: {
      skill: { schema: z.enum(["reading", "writing", "speaking"]) },
      topic: { schema: z.string() },
      format: { schema: z.string() },
      part: { schema: z.string() },
      status: { schema: z.enum(["new", "started", "completed"]) },
      q: { schema: z.string() },
      sort: { schema: z.enum(["title", "recent", "newest"]) },
      page: { schema: z.number().int().min(1) },
    },
    description:
      "Published tasks with learner progress. Pages contain 20 items. Reading answer keys are private.",
  },
  {
    id: "getTask",
    method: "get",
    path: "/tasks/{id}",
    response: taskSchema,
    description: "Read the current published task version.",
  },
  {
    id: "createAttempt",
    method: "post",
    path: "/attempts",
    body: requests.createAttemptSchema,
    response: responses.attemptSchema,
    description:
      "Start or resume an active attempt. PostgreSQL serializes concurrent creation.",
  },
  {
    id: "getAttempt",
    method: "get",
    path: "/attempts/{id}",
    response: responses.attemptResultSchema,
    description:
      "Read an owned attempt. An expired strict attempt is submitted by the server.",
  },
  {
    id: "saveAttempt",
    method: "patch",
    path: "/attempts/{id}",
    body: requests.saveAttemptSchema,
    response: responses.attemptSchema,
    description:
      "Save using the expected revision. A stale revision returns REVISION_CONFLICT. Fetch the current attempt before retrying.",
  },
  {
    id: "getResult",
    method: "get",
    path: "/attempts/{id}/result",
    response: responses.attemptResultSchema,
    description:
      "Read the persisted assessment state, including queued and processing results.",
  },
  {
    id: "submitAttempt",
    method: "post",
    path: "/attempts/{id}/submit",
    body: empty,
    response: responses.assessmentSchema,
    description:
      "Submit once. Repeated submission returns the existing assessment and never awards a second activity day.",
  },
  {
    id: "reviseAttempt",
    method: "post",
    path: "/attempts/{id}/revisions",
    body: empty,
    response: responses.attemptSchema,
    description:
      "Create or resume a practice revision of the owned original attempt.",
  },
  {
    id: "retryAssessment",
    method: "post",
    path: "/attempts/{id}/retry-assessment",
    body: empty,
    response: responses.assessmentSchema,
    description:
      "Retry eligible assessment failures under the existing per-user quota and active-job constraint.",
  },
  {
    id: "getDashboard",
    method: "get",
    path: "/dashboard",
    response: responses.dashboardSchema,
    description:
      "Read or initialize the learner's weekly plan. Calendar dates use the profile's IANA timezone.",
  },
  {
    id: "getStatistics",
    method: "get",
    path: "/statistics",
    response: responses.statisticsSchema,
    description: "Read owned learning statistics.",
  },
  {
    id: "getStreak",
    method: "get",
    path: "/streak",
    response: responses.dailyStreakSchema,
    description:
      "Read unique learning days in the profile timezone. Multiple qualifying activities on one date count once.",
  },
  {
    id: "startStudySession",
    method: "post",
    path: "/learning/{id}",
    body: empty,
    response: responses.attemptSchema,
    description: "Start or resume the plan's linked attempt.",
  },
  {
    id: "moveStudySession",
    method: "patch",
    path: "/learning/{id}",
    body: requests.moveStudySessionSchema,
    response: saved,
    description:
      "Reschedule a planned session using a YYYY-MM-DD calendar date.",
  },
  {
    id: "saveProfile",
    method: "patch",
    path: "/profile",
    body: profileInputSchema,
    response: saved,
    description:
      "Update the authenticated learner's study preferences and IANA timezone.",
  },
  {
    id: "deleteAccount",
    method: "delete",
    path: "/profile",
    body: requests.deleteAccountSchema,
    response: deleted,
    description:
      "Delete the authenticated account after explicit DELETE confirmation.",
  },
  {
    id: "acceptInvitation",
    method: "post",
    path: "/invitations/accept",
    body: requests.acceptInvitationSchema,
    response: z.object({ accepted: z.boolean() }),
    description:
      "Redeem a single-use invitation bound to the verified email. Google learners can access the app without this flow.",
  },
  {
    id: "uploadAudioTicket",
    method: "post",
    path: "/audio/upload-ticket",
    body: requests.uploadTicketSchema,
    response: z.object({ id: z.string(), path: z.string(), token: z.string() }),
    description:
      "Create a private speaking-upload ticket. Upload PCM WAV through Supabase Storage, then complete the asset. Keep the ticket for retries.",
  },
  {
    id: "completeAudio",
    method: "post",
    path: "/audio/{id}/complete",
    body: empty,
    response: z.object({ id: z.string(), duration: z.number() }),
    description:
      "Validate the uploaded mono PCM WAV at 16 kHz. Completion is safe to repeat for the same asset.",
  },
  {
    id: "playAudio",
    method: "get",
    path: "/audio/{id}",
    response: z.object({
      url: z.string(),
      duration: z.number().nullable(),
      expiresAt: z.string(),
    }),
    description:
      "Get a five-minute signed playback URL for an owned unexpired recording.",
  },
  {
    id: "deleteAudio",
    method: "delete",
    path: "/audio/{id}",
    body: empty,
    response: deleted,
    description: "Delete the owned recording.",
  },
  {
    id: "questionAudio",
    method: "post",
    path: "/audio/question",
    body: requests.questionAudioSchema,
    response: url,
    description: "Get a signed URL for the task's authored examiner question.",
  },
  {
    id: "chatHistory",
    method: "get",
    path: "/chat/messages",
    query: { thread: { schema: z.string().uuid() } },
    response: z.union([
      z.array(responses.chatThreadSchema),
      z.array(responses.chatMessageSchema),
    ]),
    description:
      "List up to 100 threads; with thread, return up to 300 owned messages.",
  },
  {
    id: "startConversation",
    method: "post",
    path: "/chat/session",
    body: preppyPreferencesSchema.strict(),
    response: chatEventSchema,
    stream: true,
    description:
      "Start a conversation and stream newline-delimited JSON events. Persist threadId and assistantId. Disconnecting playback does not discard the server response.",
  },
  {
    id: "replyToConversation",
    method: "post",
    path: "/chat/messages",
    body: requests.chatRequestSchema,
    response: chatEventSchema,
    stream: true,
    description:
      "Stream a reply as NDJSON. Send content or retryAssistantId, exclusively. Failed assistant messages can be retried using the same message ID; do not blindly retry creation after a network loss.",
  },
  {
    id: "transcribeVoice",
    method: "post",
    path: "/chat/audio/transcribe",
    query: { thread: { required: true, schema: z.string().uuid() } },
    response: z.object({ text: z.string() }),
    audio: true,
    description:
      "Send 0.3–60 seconds of mono PCM WAV at 16 kHz as audio/wav. Audio is processed in memory and not stored.",
  },
  {
    id: "speakReply",
    method: "post",
    path: "/chat/audio/speak",
    body: requests.chatAudioSchema,
    response: url,
    description:
      "Play only a completed assistant message belonging to the owned thread.",
  },
  {
    id: "welcomeAudio",
    method: "post",
    path: "/chat/audio/welcome",
    body: empty.strict(),
    response: url,
    description:
      "Play the authored Vey welcome without creating a fictional conversation.",
  },
  {
    id: "conversationFeedback",
    method: "post",
    path: "/chat/feedback",
    body: requests.chatFeedbackRequestSchema,
    response: z.discriminatedUnion("status", [
      z.object({ status: z.literal("too_short") }),
      z.object({
        status: z.literal("ready"),
        feedback: conversationFeedbackSchema,
      }),
    ]),
    description:
      "Analyze a saved conversation. Feedback quotes must occur in the learner's messages.",
  },
  {
    id: "listVocabulary",
    method: "get",
    path: "/vocabulary",
    response: z.array(responses.vocabularyWordSchema),
    description:
      "List public and owned vocabulary with saved state and practice totals.",
  },
  {
    id: "suggestWord",
    method: "post",
    path: "/vocabulary/suggest",
    body: requests.wordSuggestionSchema,
    response: wordInputSchema,
    description:
      "Ask AI to suggest a definition and example. This spends a chat quota unit.",
  },
  {
    id: "addWord",
    method: "post",
    path: "/vocabulary/words",
    body: wordInputSchema,
    response: identifier,
    description:
      "Add a personal word. The example must contain the exact term.",
  },
  {
    id: "saveWord",
    method: "post",
    path: "/vocabulary/saved",
    body: requests.saveWordSchema,
    response: saved,
    description:
      "Set the desired saved state for a visible word. Safe to repeat.",
  },
  {
    id: "createVocabularyQuiz",
    method: "post",
    path: "/vocabulary/quizzes",
    body: requests.createVocabularyQuizSchema,
    response: responses.vocabularyQuizSchema,
    description:
      "Create a ten-word quiz. Persist its ID; this operation creates a new quiz on each successful request.",
  },
  {
    id: "getVocabularyQuiz",
    method: "get",
    path: "/vocabulary/quizzes/{id}",
    response: responses.vocabularyQuizSchema,
    description: "Read an owned quiz without exposing its private answer key.",
  },
  {
    id: "submitVocabularyQuiz",
    method: "post",
    path: "/vocabulary/quizzes/{id}/submit",
    body: requests.submitVocabularyQuizSchema,
    response: z.array(responses.quizAnswerSchema),
    description:
      "Finish a quiz exactly once and return its saved result on repeated requests.",
  },
  {
    id: "startArcadeRound",
    method: "post",
    path: "/arcade-rounds",
    body: arcadeStartSchema,
    response: identifier,
    description:
      "Create a timed arcade round. Retain the ID rather than creating another round after an uncertain response.",
  },
  {
    id: "finishArcadeRound",
    method: "post",
    path: "/arcade-rounds/{id}",
    body: arcadeFinishSchema,
    response: z.object({ saved: z.boolean(), completed: z.boolean() }),
    description:
      "Validate elapsed server time and finish a round once. Only qualifying completions earn a learning day.",
  },
  {
    id: "startSpeakingArcade",
    method: "post",
    path: "/arcade",
    body: requests.speakingArcadeStartSchema,
    response: identifier,
    description: "Start a Speaking Part 2 practice round.",
  },
  {
    id: "finishSpeakingArcade",
    method: "post",
    path: "/arcade/{id}/finish",
    body: requests.speakingArcadeFinishSchema,
    response: saved,
    description:
      "Save timing and speech metrics once for an owned speaking round.",
  },
  {
    id: "issueInvitation",
    method: "post",
    path: "/admin/invitations",
    body: requests.issueInvitationSchema,
    response: z.object({ url: z.string(), expiresAt: z.string() }),
    description:
      "Administrator only: create an email-bound invitation link without sending a message.",
  },
  {
    id: "publishTask",
    method: "post",
    path: "/admin/publish",
    body: requests.publishTaskSchema,
    response: z.object({ published: z.boolean() }),
    description: "Administrator only: set task publication state.",
  },
  {
    id: "importContent",
    method: "post",
    path: "/admin/import",
    body: requests.importContentSchema,
    response: z.object({
      created: z.number(),
      updated: z.number(),
      unchanged: z.number(),
    }),
    description:
      "Administrator only: validate and import versioned content. Identical content hashes are unchanged.",
  },
];
