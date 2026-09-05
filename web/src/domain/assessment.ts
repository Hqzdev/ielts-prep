import { z } from "zod";
import type { AssessmentStatus } from "./attempt";

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
export type Feedback = z.infer<typeof feedbackSchema>;
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
export type Transcript = z.infer<typeof transcriptSchema>;
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
export type Grade = z.infer<typeof gradeSchema>;

export interface ReadingVerdict {
  number: number;
  statement: string;
  given: string[];
  expected: string[];
  correct: boolean;
  earned: number;
  possible: number;
  paragraph: string;
  evidence: string;
  explanation: string;
}

export interface Assessment {
  id: string;
  attemptId: string;
  userId: string;
  status: AssessmentStatus;
  band: number | null;
  grade: Grade | null;
  reading: ReadingVerdict[] | null;
  transcripts: Transcript[];
  model: string | null;
  rubricVersion: string;
  errorCode: string | null;
  createdAt: string;
  completedAt: string | null;
}

export class BandCalculator {
  calculate(scores: number[]): number | null {
    if (
      scores.length !== 4 ||
      scores.some((score) => !Number.isFinite(score) || score < 1 || score > 9)
    )
      return null;
    return (
      Math.round(
        (scores.reduce((sum, score) => sum + score, 0) / scores.length) * 2,
      ) / 2
    );
  }
}

export const categoryLabels: Record<Feedback["category"], string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  coherence: "Coherence",
  task_response: "Task response",
  task_achievement: "Task achievement",
  data_accuracy: "Data accuracy",
  fluency: "Fluency",
  pronunciation: "Pronunciation",
  reading: "Reading comprehension",
};
