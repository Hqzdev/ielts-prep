import { isVeyExpression } from "./vey-expressions";

import type { PreppyExpression, PreppyPosition } from "./preppy";

export class PreppyReplyDecoder {
  private prefix = "";
  private started = false;
  constructor(
    private readonly onExpression: (
      expression: PreppyExpression,
      position: PreppyPosition,
    ) => void,
  ) {}
  push(chunk: string) {
    if (this.started) return chunk;
    this.prefix += chunk;
    const value = this.prefix.trimStart();
    if ("<face".startsWith(value) && value.length < 5) return "";
    if (value.startsWith("<face") && !value.includes(">") && value.length < 256)
      return "";
    this.started = true;
    const match = value.match(
      /^<face\s+expression="([a-z]+)"(?:\s+position="([a-z-]+)")?\s*\/?>\s*/,
    );
    if (match) {
      const expression = match[1];
      const position = match[2] ?? "default";
      if (
        isVeyExpression(expression) &&
        ["default", "center", "mid-left", "mid-right", "top-mid"].includes(
          position,
        )
      )
        this.onExpression(
          expression as PreppyExpression,
          position as PreppyPosition,
        );
      return value.slice(match[0].length);
    }
    return value.startsWith("<face")
      ? value.replace(/^<face[^>]*(?:>|$)\s*/, "")
      : this.prefix;
  }
  finish() {
    if (this.started) return "";
    this.started = true;
    const value = this.prefix.trimStart();
    return value.startsWith("<face") || "<face".startsWith(value)
      ? ""
      : this.prefix;
  }
}
