import { z } from "zod";
import {
  profileSchema,
  dailyStreakSchema,
  catalogItemSchema,
  statisticsSchema,
  quizQuestionSchema,
  quizAnswerSchema,
} from "./responses";

export const nativeSkillSchema = z.enum(["reading", "writing"]);
export const nativeAnswersSchema = z.object({
  startingLevel: z
    .enum(["below_5_5", "5_5_6_0", "6_5_7_0", "7_5_plus", "unknown"])
    .nullable()
    .default(null),
  targetBand: z
    .number()
    .refine((value) => [6.5, 7, 7.5, 8].includes(value))
    .nullable()
    .default(null),
  examStatus: z.enum(["unanswered", "not_booked", "scheduled"]),
  examDate: z.iso.date().nullable().default(null),
  focus: z
    .array(nativeSkillSchema)
    .max(2)
    .refine((values) => new Set(values).size === values.length),
  barrier: z
    .enum([
      "time",
      "direction",
      "anxiety",
      "previous_attempt",
      "other",
      "private",
    ])
    .nullable()
    .default(null),
});
export const nativePreferencesSchema = z.object({
  dailyReminder: z.boolean(),
  reminderHour: z.number().int().min(0).max(23),
  soundEffects: z.boolean(),
});
export const nativeOnboardingSchema = z.object({
  revision: z.number().int().nonnegative(),
  version: z.literal(1),
  step: z.number().int().min(0).max(5),
  completedAt: z.string().nullable(),
  answers: nativeAnswersSchema,
  preferences: nativePreferencesSchema,
});
export const saveNativeOnboardingSchema = z.object({
  revision: z.number().int().nonnegative(),
  step: z.number().int().min(0).max(5),
  answers: nativeAnswersSchema,
  complete: z.boolean().default(false),
});
export const nativeBootstrapSchema = z.object({
  profile: profileSchema,
  onboarding: nativeOnboardingSchema,
  capabilities: z.object({
    skills: z.array(nativeSkillSchema),
    writingAssessment: z.boolean(),
    textAI: z.boolean(),
    speakingRecording: z.boolean(),
    voiceAI: z.literal(false),
    fullExam: z.literal(false),
  }),
});
export const nativeForecastSchema = z.object({
  skill: nativeSkillSchema,
  target: z.number(),
  estimatedDate: z.string().nullable(),
  reason: z.enum([
    "insufficient_data",
    "no_growth",
    "too_distant",
    "reached",
    "projected",
  ]),
  resultCount: z.number(),
});
export const nativeProgressSchema = z.object({
  statistics: statisticsSchema,
  forecasts: z.array(nativeForecastSchema),
  streak: dailyStreakSchema,
});
export const nativeDashboardSchema = z.object({
  today: z.string(),
  tasks: z.array(catalogItemSchema),
  streak: dailyStreakSchema,
  completed: z.number(),
  total: z.number(),
});
export const nativeAttemptNotesSchema = z.object({
  revision: z.number().int().nonnegative(),
  flaggedQuestions: z.array(z.number().int().positive()).max(100),
  highlights: z.array(z.string().max(4000)).max(100),
});
export const nativeHintSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  questionNumber: z.number().int().positive().optional(),
});
export const nativeEventSchema = z.object({
  id: z.uuid(),
  event: z.enum([
    "onboarding_started",
    "onboarding_step_viewed",
    "onboarding_answer_saved",
    "onboarding_review_viewed",
    "onboarding_completed",
  ]),
  step: z.number().int().min(0).max(5),
  entry: z.enum(["forward", "back", "resume", "review"]),
  version: z.literal(1),
});
export const sprintSchema = z.object({
  id: z.uuid(),
  score: z.number().int(),
  lives: z.number().int(),
  index: z.number().int(),
  total: z.number().int(),
  finished: z.boolean(),
  question: quizQuestionSchema.nullable(),
  lastAnswer: quizAnswerSchema.nullable(),
});
export const sprintAnswerSchema = z.object({
  questionId: z.string().max(20),
  answer: z.string().max(500),
});
