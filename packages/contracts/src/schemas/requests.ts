import { z } from "zod";
import { answerSchema } from "./attempt";
import { preppyPreferencesSchema } from "./preppy";
import { contentEntrySchema } from "./task";

export const emptyRequestSchema = z.object({});
export const createAttemptSchema = z.object({
  taskId: z.string().max(100),
  mode: z.enum(["practice", "strict"]),
});
export const saveAttemptSchema = z.object({
  revision: z.number().int().nonnegative(),
  answer: answerSchema,
  action: z.enum(["pause", "resume"]).optional(),
});
export const moveStudySessionSchema = z.object({ date: z.iso.date() });
export const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE"),
});
export const acceptInvitationSchema = z.object({
  token: z.string().min(32).max(128),
});
export const issueInvitationSchema = z.object({ email: z.email() });
export const publishTaskSchema = z.object({
  id: z.string().max(100),
  published: z.boolean(),
});
export const importContentSchema = z.object({
  entries: z.array(contentEntrySchema).min(1).max(500),
});
export const uploadTicketSchema = z.object({
  attemptId: z.uuid(),
  questionIndex: z.number().int().nonnegative(),
  bytes: z.number().int().min(44).max(20971520),
});
export const questionAudioSchema = z.object({
  taskId: z.string(),
  questionIndex: z.number().int().nonnegative(),
});
export const chatRequestSchema = preppyPreferencesSchema
  .extend({
    content: z.string().trim().min(1).max(6000).optional(),
    retryAssistantId: z.uuid().optional(),
    threadId: z.uuid().optional(),
    attemptId: z.uuid().optional(),
  })
  .refine(
    (input) =>
      Boolean(input.content) !== Boolean(input.retryAssistantId) &&
      (!input.retryAssistantId || Boolean(input.threadId)),
    "Provide a message or an interrupted reply to retry",
  );
export const chatAudioSchema = preppyPreferencesSchema.extend({
  threadId: z.uuid(),
  messageId: z.uuid(),
});
export const chatFeedbackRequestSchema = z.object({ threadId: z.uuid() });
export const wordSuggestionSchema = z.object({
  term: z.string().trim().min(1).max(100),
  topic: z.string().trim().min(1).max(60),
});
export const saveWordSchema = z.object({
  wordId: z.string().max(150),
  saved: z.boolean(),
});
export const createVocabularyQuizSchema = z.object({
  topic: z.string().max(60).optional(),
  personal: z.boolean().optional(),
});
export const submitVocabularyQuizSchema = z.object({
  answers: z.record(z.string(), z.string().max(500)),
});
export const speakingArcadeStartSchema = z.object({ taskId: z.string() });
export const speakingArcadeFinishSchema = z
  .object({
    durationSeconds: z.number().min(0).max(120),
    speechSeconds: z.number().min(0).max(120),
    longestPause: z.number().min(0).max(120),
    completed: z.boolean(),
  })
  .refine(
    (value) =>
      value.speechSeconds <= value.durationSeconds + 0.05 &&
      value.longestPause <= value.durationSeconds + 0.05 &&
      (!value.completed || value.durationSeconds >= 119.9),
  );
