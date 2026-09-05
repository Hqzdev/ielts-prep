import { z } from "zod";

export const wordFieldsSchema = z.object({
  term: z.string().trim().min(1).max(100),
  translation: z.string().trim().min(1).max(200),
  partOfSpeech: z.string().trim().min(1).max(40),
  example: z.string().trim().min(5).max(700),
  topic: z.string().trim().min(1).max(60),
});

export const wordInputSchema = wordFieldsSchema.refine(
  (word) => word.example.toLowerCase().includes(word.term.toLowerCase()),
  "The example must contain the word in its exact form",
);
