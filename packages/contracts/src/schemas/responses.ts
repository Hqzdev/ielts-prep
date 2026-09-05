import { z } from "zod";
import { taskSchema } from "./task";
import { answerSchema } from "./attempt";
import { gradeSchema, transcriptSchema } from "./assessment";
import { profileInputSchema } from "./profile";

export const attemptSchema = z.object({
  id: z.string(),
  userId: z.string(),
  taskId: z.string(),
  taskVersion: z.number(),
  taskSnapshot: taskSchema,
  mode: z.enum(["practice", "strict"]),
  status: z.enum(["in_progress", "paused", "submitted", "completed"]),
  answer: answerSchema,
  revision: z.number(),
  parentAttemptId: z.string().nullable(),
  startedAt: z.string(),
  deadlineAt: z.string().nullable(),
  submittedAt: z.string().nullable(),
  elapsedSeconds: z.number(),
  activeSince: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const readingVerdictSchema = z.object({
  number: z.number(),
  statement: z.string(),
  given: z.array(z.string()),
  expected: z.array(z.string()),
  correct: z.boolean(),
  earned: z.number(),
  possible: z.number(),
  paragraph: z.string(),
  evidence: z.string(),
  explanation: z.string(),
});

export const assessmentSchema = z.object({
  id: z.string(),
  attemptId: z.string(),
  userId: z.string(),
  status: z.enum([
    "unavailable",
    "queued",
    "processing",
    "ready",
    "failed",
    "insufficient_evidence",
  ]),
  band: z.number().nullable(),
  grade: gradeSchema.nullable(),
  reading: z.array(readingVerdictSchema).nullable(),
  transcripts: z.array(transcriptSchema),
  model: z.string().nullable(),
  rubricVersion: z.string(),
  errorCode: z.string().nullable(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
});

export const attemptResultSchema = z.object({
  attempt: attemptSchema,
  assessment: assessmentSchema.nullable(),
});
export const profileSchema = profileInputSchema.extend({
  name: z.string(),
  id: z.string(),
  email: z.string(),
  role: z.enum(["student", "admin"]),
  betaAccess: z.boolean(),
  onboarded: z.boolean(),
});
export const catalogItemSchema = z.object({
  task: taskSchema,
  status: z.enum(["new", "started", "completed"]),
  lastAttemptId: z.string().nullable(),
  lastBand: z.number().nullable(),
  lastAccuracy: z.number().nullable(),
  lastActivity: z.string().nullable(),
});
export const catalogPageSchema = z.object({
  items: z.array(catalogItemSchema),
  total: z.number(),
  page: z.number(),
});
export const skillStatisticsSchema = z.object({
  skill: z.enum(["writing", "speaking", "reading"]),
  count: z.number(),
  latest: z.number().nullable(),
  average: z.number().nullable(),
  unit: z.literal("band"),
  series: z.array(
    z.object({
      date: z.string(),
      value: z.number(),
      part: z.number(),
      mode: z.string(),
    }),
  ),
  criteria: z.array(
    z.object({ key: z.string(), label: z.string(), average: z.number() }),
  ),
  formats: z.array(
    z.object({
      format: z.string(),
      correct: z.number(),
      total: z.number(),
      accuracy: z.number(),
    }),
  ),
  errors: z.array(z.object({ category: z.string(), count: z.number() })),
});
export const statisticsSchema = z.object({
  skills: z.array(skillStatisticsSchema),
  independentCount: z.number(),
  revisionCount: z.number(),
  totalMinutes: z.number(),
  history: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      title: z.string(),
      skill: z.enum(["writing", "speaking", "reading"]),
      mode: z.enum(["practice", "strict"]),
      band: z.number().nullable(),
      accuracy: z.number().nullable(),
      durationMinutes: z.number(),
    }),
  ),
  activity: z.array(z.object({ date: z.string(), count: z.number() })),
});
export const studySessionSchema = z.object({
  id: z.string(),
  scheduledDate: z.string(),
  weekStart: z.string(),
  taskId: z.string(),
  plannedMinutes: z.number(),
  status: z.enum(["planned", "started", "completed", "skipped"]),
  attemptId: z.string().nullable(),
  position: z.number(),
  task: taskSchema,
});
export const dashboardSchema = z.object({
  today: z.string(),
  week: z.string(),
  sessions: z.array(studySessionSchema),
  statistics: statisticsSchema,
  resume: attemptSchema.nullable(),
  focus: z.object({ category: z.string(), count: z.number() }).nullable(),
});
export const dailyStreakSchema = z.object({
  today: z.string(),
  timezone: z.string(),
  current: z.number(),
  best: z.number(),
  todayComplete: z.boolean(),
  week: z.array(
    z.object({
      date: z.string(),
      label: z.string(),
      state: z.enum(["earned", "today", "missed", "upcoming"]),
    }),
  ),
});
export const vocabularyWordSchema = z.object({
  id: z.string(),
  ownerId: z.string().nullable(),
  topic: z.string(),
  term: z.string(),
  translation: z.string(),
  partOfSpeech: z.string(),
  example: z.string(),
  gapSentence: z.string(),
  alternatives: z.array(z.string()),
  saved: z.boolean(),
  correct: z.number(),
  total: z.number(),
});
export const quizQuestionSchema = z.object({
  id: z.string(),
  wordId: z.string(),
  type: z.enum(["translation", "gap"]),
  prompt: z.string(),
  options: z.array(z.string()),
});
export const quizAnswerSchema = z.object({
  questionId: z.string(),
  wordId: z.string(),
  type: z.enum(["translation", "gap"]),
  given: z.string(),
  expected: z.string(),
  correct: z.boolean(),
  term: z.string(),
  translation: z.string(),
  example: z.string(),
});
export const vocabularyQuizSchema = z.object({
  id: z.string(),
  questions: z.array(quizQuestionSchema),
  result: z.array(quizAnswerSchema).nullable(),
});
export const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  status: z.string(),
});
export const chatThreadSchema = z.object({
  id: z.string(),
  title: z.string(),
  attemptId: z.string().nullable(),
  createdAt: z.string(),
});
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
  }),
});
