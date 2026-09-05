import { z } from "zod";

export const arcadeStartSchema = z.object({
  game: z.enum(["challenge", "survival", "runner"]),
  duration: z.union([z.literal(30), z.literal(60)]),
});
export const arcadeFinishSchema = z
  .object({
    elapsed: z.number().min(0).max(60),
    speechSeconds: z.number().min(0).max(61),
    answers: z.number().int().min(0).max(8),
  })
  .refine((value) => value.speechSeconds <= value.elapsed + 0.15);
