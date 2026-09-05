import { z } from "zod";

export const personalitySchema = z.enum([
  "classic",
  "angry",
  "kind",
  "sarcastic",
]);

export const preppyPreferencesSchema = z.object({
  personality: personalitySchema.default("classic"),
  explicit: z.boolean().default(false),
});

export const preppyExpressionSchema = z.enum([
  "happy",
  "cheeky",
  "angry",
  "sad",
  "horrified",
  "sheepish",
  "smug",
  "neutral",
  "excited",
  "skeptical",
  "love",
  "wince",
  "surprised",
  "annoyed",
  "devastated",
  "unamused",
  "asleep",
  "furious",
]);
export const preppyPositionSchema = z.enum([
  "default",
  "center",
  "mid-left",
  "mid-right",
  "top-mid",
]);
