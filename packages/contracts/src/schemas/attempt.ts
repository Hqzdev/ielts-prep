import { z } from "zod";

export const answerSchema = z.object({
  text: z.string().max(40000).default(""),
  reading: z
    .record(
      z.string(),
      z.union([z.string().max(500), z.array(z.string().max(500)).max(10)]),
    )
    .default({}),
  audioIds: z.array(z.uuid()).max(20).default([]),
});
