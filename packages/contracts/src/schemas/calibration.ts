import { z } from "zod";

import { taskSchema } from "./task";

export const calibrationCaseSchema = z.object({
  id: z.string().min(1),
  split: z.enum(["tuning", "holdout"]),
  source: z.string().min(1),
  expertBand: z.number().min(1).max(9).multipleOf(0.5),
  task: taskSchema,
  answer: z.string().default(""),
  audio: z
    .array(
      z.object({
        path: z.string().min(1),
        questionIndex: z.number().int().nonnegative(),
      }),
    )
    .default([]),
});

export const calibrationCorpusSchema = z.array(calibrationCaseSchema).min(1);
