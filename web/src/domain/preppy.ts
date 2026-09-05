import { z } from "zod";
import type { VeyExpression } from "./vey-expressions";
import type { VeyMotion } from "./vey-motion";

export type PreppyExpression = VeyExpression;
export type PreppyPosition =
  "default" | "center" | "mid-left" | "mid-right" | "top-mid";
export const personalitySchema = z.enum([
  "classic",
  "angry",
  "kind",
  "sarcastic",
]);
export type PreppyPersonality = z.infer<typeof personalitySchema>;
export const preppyPreferencesSchema = z.object({
  personality: personalitySchema.default("classic"),
  explicit: z.boolean().default(false),
});
export type PreppyPreferences = z.infer<typeof preppyPreferencesSchema>;

export const personalities = [
  {
    id: "classic",
    label: "Classic",
    color: "var(--listening)",
    expression: "neutral",
    description: "A balanced, friendly tutor for everyday practice.",
    sample: "Tell me about your last weekend — in as much detail as you can.",
    instruction:
      "Be balanced, friendly and conversational. Encourage detail with useful follow-up questions.",
  },
  {
    id: "angry",
    label: "Angry",
    color: "var(--writing)",
    expression: "angry",
    description: "Tough-love coaching. Brutally honest, no sugar-coating.",
    sample: "That was weak. Say it again — properly this time.",
    instruction:
      "Be a demanding, blunt tough-love coach. Challenge weak answers and push for specific detail. Critique the answer, never a person's worth or identity.",
  },
  {
    id: "kind",
    label: "Kind",
    color: "var(--reading-surface)",
    expression: "happy",
    description: "Warm and encouraging. Gentle feedback to build confidence.",
    sample: "Take your time — you're doing really well. Keep going!",
    instruction:
      "Be warm, patient and encouraging. Give gentle, specific corrections and build the learner's confidence.",
  },
  {
    id: "sarcastic",
    label: "Sarcastic",
    color: "var(--vocabulary)",
    expression: "skeptical",
    description: "Witty and sharp. Keeps you on your toes with dry humor.",
    sample: "Oh, fascinating. Now try saying it like you mean it.",
    instruction:
      "Use playful dry humor and light sarcasm while giving useful feedback. Keep it friendly and never humiliating.",
  },
] as const;

export function personalityFor(id: PreppyPersonality) {
  return personalities.find((personality) => personality.id === id)!;
}

export const introductionBeats: {
  expression: PreppyExpression;
  position: PreppyPosition;
  caption: string;
  motion: VeyMotion;
}[] = [
  {
    expression: "happy",
    position: "center",
    caption: "Friendly",
    motion: "greeting",
  },
  {
    expression: "neutral",
    position: "mid-left",
    caption: "Patient with you",
    motion: "patient",
  },
  {
    expression: "furious",
    position: "center",
    caption: "Helps you improve",
    motion: "explaining",
  },
  {
    expression: "love",
    position: "center",
    caption: "Always on your side",
    motion: "support",
  },
  {
    expression: "excited",
    position: "top-mid",
    caption: "Celebrates your wins",
    motion: "victory",
  },
  {
    expression: "cheeky",
    position: "mid-right",
    caption: "…and a little cheeky",
    motion: "hint",
  },
];

export function expressionColor(expression: PreppyExpression) {
  const colors: Partial<Record<PreppyExpression, string>> = {
    surprised: "var(--speaking-ink)",
    sad: "var(--reading-ink)",
    unamused: "var(--muted)",
    asleep: "var(--muted)",
    skeptical: "var(--heading)",
    furious: "var(--writing-ink)",
    love: "var(--writing-ink)",
    excited: "var(--speaking-ink)",
    cheeky: "var(--listening-ink)",
  };
  return colors[expression] ?? "var(--heading)";
}

export const preppyWelcome =
  "Hi! I'm Vey, your study buddy. Ask me anything about your IELTS prep or how to use our platform.";

export class PreppyCarouselLayout {
  readonly compact: boolean;
  readonly width: number;
  readonly height: number;
  readonly offset: number;
  constructor(available: number) {
    this.compact = available < 560;
    const usable = Math.max(220, available - 2 * (this.compact ? 8 : 56));
    this.width = Math.round(
      Math.min(
        this.compact ? 360 : 380,
        Math.max(200, usable * (this.compact ? 0.82 : 0.44)),
      ),
    );
    this.height = Math.round(this.width * (this.compact ? 1.6 : 1.3));
    this.offset = Math.max(
      60,
      Math.min(
        Math.round(this.width * (this.compact ? 0.5 : 0.62)),
        Math.round(usable / 2 - (0.84 * this.width) / 2),
      ),
    );
  }
  card(index: number, selected: number) {
    let distance =
      (index - selected + personalities.length) % personalities.length;
    if (distance > personalities.length / 2) distance -= personalities.length;
    const active = distance === 0;
    const visible = Math.abs(distance) <= 1;
    return {
      active,
      visible,
      x: active ? 0 : Math.sign(distance) * this.offset,
      y: active ? 0 : 14,
      scale: active ? 1 : visible ? 0.84 : 0.7728,
      opacity: active ? 1 : visible ? 0.92 : 0,
      z: active ? 30 : visible ? 20 : 10,
    };
  }
}
