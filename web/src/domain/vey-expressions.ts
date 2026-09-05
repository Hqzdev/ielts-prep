export const veyExpressions = [
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
] as const;

export type VeyExpression = (typeof veyExpressions)[number];

export function isVeyExpression(value: unknown): value is VeyExpression {
  return (
    typeof value === "string" &&
    (veyExpressions as readonly string[]).includes(value)
  );
}
