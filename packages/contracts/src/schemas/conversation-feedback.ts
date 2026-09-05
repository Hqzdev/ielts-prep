import { z } from "zod";

export const conversationFeedbackSchema = z.object({
  strengths: z.array(z.string().min(1).max(600)).max(4),
  improvements: z
    .array(
      z.object({
        quote: z.string().min(1).max(500),
        correction: z.string().min(1).max(500),
        explanation: z.string().min(1).max(600),
      }),
    )
    .max(5),
  words: z
    .array(
      z.object({
        term: z.string().min(1).max(100),
        meaning: z.string().min(1).max(200),
        partOfSpeech: z.string().min(1).max(40),
        example: z.string().min(5).max(500),
      }),
    )
    .max(5),
});
