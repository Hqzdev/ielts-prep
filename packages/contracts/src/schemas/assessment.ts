import { z } from "zod";

export const feedbackSchema = z.object({
  category: z.enum([
    "grammar",
    "vocabulary",
    "coherence",
    "task_response",
    "task_achievement",
    "data_accuracy",
    "fluency",
    "pronunciation",
    "reading",
  ]),
  subcategory: z.string().max(100),
  issue: z.string().min(1),
  correction: z.string(),
  anchor: z.discriminatedUnion("type", [
    z.object({ type: z.literal("text"), quote: z.string().min(1) }),
    z.object({
      type: z.literal("requirement"),
      requirement: z.string().min(1),
    }),
    z.object({
      type: z.literal("audio"),
      audioId: z.string(),
      startSeconds: z.number().nonnegative(),
      endSeconds: z.number().nonnegative(),
      quote: z.string(),
    }),
    z.object({
      type: z.literal("question"),
      number: z.number().int().positive(),
      quote: z.string(),
    }),
  ]),
});

export const criterionSchema = z.object({
  key: z.string(),
  label: z.string(),
  score: z.number().min(1).max(9).multipleOf(0.5),
  explanation: z.string(),
});

export const transcriptSchema = z.object({
  audioId: z.string(),
  text: z.string(),
  segments: z.array(
    z.object({
      startSeconds: z.number().nonnegative(),
      endSeconds: z.number().nonnegative(),
      text: z.string(),
    }),
  ),
});

export const gradeSchema = z.object({
  sufficientEvidence: z.boolean(),
  insufficientReason: z.string().nullable(),
  criteria: z.array(criterionSchema).max(4),
  errors: z.array(feedbackSchema).max(30),
  strengths: z.array(z.string()).max(3),
  nextFocus: z.string(),
  fulfilledRequirements: z
    .array(
      z.object({
        requirement: z.string(),
        fulfilled: z.boolean(),
        explanation: z.string(),
      }),
    )
    .default([]),
});
