import { describe, expect, it } from "vitest";
import { PreppyReplyDecoder } from "@veylo/backend/domain/preppy-reply";
import { PreppyCarouselLayout } from "@veylo/ui-web/domain/preppy";
import { preppyPreferencesSchema } from "@veylo/contracts/schemas/preppy";
import { ConversationMetrics } from "@veylo/backend/domain/conversation-feedback";
import { isVeyExpression } from "@veylo/backend/domain/vey-expressions";

describe("Preppy expression stream", () => {
  it("decodes a control tag split at every possible character without leaking it into speech", () => {
    const input =
      '<face expression="love" position="mid-left"/> You are doing well.';
    for (let index = 1; index < input.length; index++) {
      const expressions: string[] = [];
      const decoder = new PreppyReplyDecoder((expression, position) =>
        expressions.push(`${expression}:${position}`),
      );
      const text =
        decoder.push(input.slice(0, index)) +
        decoder.push(input.slice(index)) +
        decoder.finish();
      expect(text.trim()).toBe("You are doing well.");
      expect(expressions).toEqual(["love:mid-left"]);
    }
  });
  it("preserves untagged replies and discards incomplete control tags", () => {
    const plain = new PreppyReplyDecoder(() => {});
    expect(plain.push("Hello") + plain.push(" there") + plain.finish()).toBe(
      "Hello there",
    );
    for (const text of ["<", "<fa", '<face expression="ha']) {
      const interrupted = new PreppyReplyDecoder(() => {});
      expect(interrupted.push(text) + interrupted.finish()).toBe("");
    }
  });
  it("does not accept unknown expressions or positions", () => {
    for (const tag of [
      '<face expression="unknown"/>',
      '<face expression="happy" position="offscreen"/>',
    ]) {
      const expressions: string[] = [];
      const decoder = new PreppyReplyDecoder((expression) =>
        expressions.push(expression),
      );
      expect(decoder.push(`${tag}Hello`)).toBe("Hello");
      expect(expressions).toEqual([]);
    }
  });
  it("accepts supported expressions and rejects object prototype keys", () => {
    expect(isVeyExpression("happy")).toBe(true);
    expect(isVeyExpression("constructor")).toBe(false);
    expect(isVeyExpression(null)).toBe(false);
  });
});

describe("Preppy personality carousel", () => {
  it("wraps adjacent cards around both ends and hides the opposite card", () => {
    const layout = new PreppyCarouselLayout(1024);
    expect(layout.card(3, 0)).toMatchObject({
      visible: true,
      active: false,
      x: -layout.offset,
    });
    expect(layout.card(1, 0)).toMatchObject({
      visible: true,
      x: layout.offset,
    });
    expect(layout.card(2, 0).visible).toBe(false);
    expect(layout.card(0, 3).x).toBe(layout.offset);
  });
  it("keeps a tall centered card on mobile and the original desktop proportions", () => {
    const mobile = new PreppyCarouselLayout(358);
    expect(mobile.compact).toBe(true);
    expect(mobile.width).toBeLessThan(358);
    expect(mobile.height).toBe(Math.round(mobile.width * 1.6));
    const desktop = new PreppyCarouselLayout(1024);
    expect(desktop.width).toBe(380);
    expect(desktop.height).toBe(494);
  });
  it("defaults to Classic without explicit mode and rejects invented personalities", () => {
    expect(preppyPreferencesSchema.parse({})).toEqual({
      personality: "classic",
      explicit: false,
    });
    expect(
      preppyPreferencesSchema.safeParse({ personality: "invented" }).success,
    ).toBe(false);
  });
});

describe("conversation metrics", () => {
  it("counts only learner speech and does not pretend a short reply is enough to analyse", () => {
    const metrics = new ConversationMetrics([
      { role: "assistant", content: "Say something about your home." },
      { role: "user", content: "I live in London. I like London." },
    ]);
    expect(metrics.words).toBe(7);
    expect(metrics.uniqueWords).toBe(5);
    expect(metrics.answers).toBe(1);
    expect(metrics.sentences).toBe(2);
    expect(metrics.sufficient).toBe(false);
  });
});
