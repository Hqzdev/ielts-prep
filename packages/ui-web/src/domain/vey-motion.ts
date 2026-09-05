import motionData from "@veylo/design-tokens/vey-motion.json";
import type { PreppyExpression } from "@veylo/backend/domain/preppy";
import type { PreppyState } from "@veylo/backend/domain/voice-conversation";

export type VeyMotion = keyof typeof motionData.poses;

export interface VeyPose {
  tilt: number;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  left: number;
  right: number;
  eyes: number;
  joy: number;
  smile: number;
  mouth: number;
  lookX: number;
  lookY: number;
}

export const restingPose: VeyPose = motionData.restingPose;

const poses: Record<VeyMotion, Partial<VeyPose>> = motionData.poses;

export function veyMotionFor(
  state: PreppyState,
  expression?: PreppyExpression,
): VeyMotion {
  if (state === "error") return "error";
  if (state === "speaking") return "speaking";
  if (state === "listening") return "listening";
  if (state === "thinking") return "thinking";
  if (state === "success") return "victory";
  if (expression === "angry" || expression === "furious") return "angry";
  if (expression === "happy" || expression === "love") return "gentle";
  if (expression === "skeptical") return "sarcastic";
  if (expression === "excited") return "success";
  if (expression === "surprised") return "question";
  if (expression === "cheeky" || expression === "smug") return "hint";
  if (expression === "asleep") return "patient";
  if (
    expression &&
    [
      "sad",
      "wince",
      "horrified",
      "annoyed",
      "devastated",
      "unamused",
      "sheepish",
    ].includes(expression)
  )
    return "support";
  return "idle";
}

export function veyConversationMotion(
  state: PreppyState,
  recording: boolean,
  error: string,
  lastReply = "",
  expression?: PreppyExpression,
): VeyMotion {
  if (state === "error" && /hear|no.speech|silence|empty.audio/i.test(error))
    return "misheard";
  if (state === "listening" && !recording)
    return lastReply.trim().endsWith("?") ? "question" : "patient";
  if (state === "idle" && lastReply.trim().endsWith("?")) return "question";
  return veyMotionFor(state, expression);
}

const pulse = (time: number, start: number, duration: number) =>
  time < start || time > start + duration
    ? 0
    : Math.sin((Math.PI * (time - start)) / duration);

export class VeyMotionModel {
  private motion: VeyMotion = "idle";
  private started = 0;
  private current = { ...restingPose };
  private previous = 0;

  transition(motion: VeyMotion, now: number, restart = false) {
    if (this.motion === motion && !restart) return;
    this.motion = motion;
    this.started = now;
  }

  sample(
    now: number,
    reduced = false,
    compact = false,
    subdued = false,
  ): VeyPose {
    const time = Math.max(0, (now - this.started) / 1000);
    const target = { ...restingPose, ...poses[this.motion] };
    if (!reduced && !compact) {
      const breath = Math.sin(
        (now / motionData.timing.breathing) * Math.PI * 2,
      );
      target.scaleY += breath * 0.008;
      target.scaleX -= breath * 0.004;
      if (this.motion === "idle" || subdued) {
        target.tilt += Math.sin((now / 19000) * Math.PI * 2) * 1.5;
        target.right += Math.sin((now / 9000) * Math.PI * 2) * 1.2;
      }
      if (!subdued && this.motion === "angry") {
        const tension = pulse(time % 4.6, 0.25, 0.85);
        const shake = Math.sin(time * 46) * tension;
        target.x += shake * 3.8;
        target.tilt += shake * 4.5;
        target.scaleX += tension * 0.025;
        target.scaleY -= tension * 0.03;
        target.left += Math.sin(time * 33) * tension * 6;
        target.right -= Math.sin(time * 33 + 0.7) * tension * 7;
        target.y += pulse(time % 4.6, 1.1, 0.65) * 2;
      }
      if (!subdued && this.motion === "gentle") {
        target.tilt += Math.sin(time * 1.15) * 3;
        target.y += pulse(time % 7, 2, 1.2) * 4;
        target.right += Math.sin(time * 1.4) * 2.5;
        target.joy = pulse(time % 7, 2, 1.6);
      }
      if (!subdued && this.motion === "sarcastic") {
        const glance = pulse(time % 7.5, 1.5, 2.2);
        target.lookX += glance * 2;
        target.lookY -= glance * 3;
        target.tilt -= glance * 4;
        target.left += pulse(time % 7.5, 3.6, 1.5) * 5;
      }
      if (this.motion === "thinking") {
        target.left += Math.sin(time * 2.1) * 4;
        target.right += Math.sin(time * 2.1 + 1.4) * 4;
      }
      if (this.motion === "listening") target.y += pulse(time % 9, 7, 0.7) * 3;
      if (["greeting", "farewell"].includes(this.motion)) {
        target.right += Math.sin(time * 13) * 9 * pulse(time, 0, 1);
        target.y -= pulse(time, 0, 0.8) * 5;
      }
      if (["understood", "hint", "success", "retry"].includes(this.motion))
        target.y +=
          pulse(time, 0.05, 0.65) * (this.motion === "success" ? -7 : 4);
      if (this.motion === "victory") {
        const squeeze = pulse(time, 0, 0.22);
        const jump = pulse(time, 0.18, 0.7);
        const land = pulse(time, 0.8, 0.35);
        target.scaleX += squeeze * 0.1 - jump * 0.04 + land * 0.07;
        target.scaleY += -squeeze * 0.12 + jump * 0.06 - land * 0.08;
        target.y -= jump * 20;
      }
      if (this.motion === "tap") {
        const squeeze = pulse(time, 0, 0.28);
        target.scaleX += squeeze * 0.08;
        target.scaleY -= squeeze * 0.09;
      }
      if (this.motion === "speaking" || this.motion === "explaining")
        target.tilt += Math.sin(time * 1.7) * 1.2;
    }
    const elapsed = this.previous
      ? Math.min(motionData.timing.maxFrame, Math.max(0, now - this.previous))
      : motionData.timing.initialFrame;
    this.previous = now;
    for (const key of Object.keys(target) as (keyof VeyPose)[]) {
      const lag =
        key === "left" || key === "right"
          ? motionData.timing.petalLag
          : motionData.timing.bodyLag;
      const blend = reduced ? 1 : 1 - Math.exp(-elapsed / lag);
      this.current[key] += (target[key] - this.current[key]) * blend;
    }
    return { ...this.current };
  }
}
