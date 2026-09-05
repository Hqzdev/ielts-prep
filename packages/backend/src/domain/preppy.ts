import type { VeyExpression } from "./vey-expressions";

export type PreppyExpression = VeyExpression;

export type PreppyPosition =
  "default" | "center" | "mid-left" | "mid-right" | "top-mid";

export type PreppyPersonality = "classic" | "angry" | "kind" | "sarcastic";

export type PreppyPreferences = {
  personality: "classic" | "angry" | "kind" | "sarcastic";
  explicit: boolean;
};
