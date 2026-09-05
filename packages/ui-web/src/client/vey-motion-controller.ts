import {
  VeyMotionModel,
  type VeyMotion,
} from "@veylo/ui-web/domain/vey-motion";
import { veyGeometry } from "@veylo/ui-web/domain/vey-geometry";
import { VeyFaceModel, veyFaceGeometry } from "@veylo/ui-web/domain/vey-face";
import type { VeyExpression } from "@veylo/backend/domain/vey-expressions";
import { VeyGazeController } from "@veylo/ui-web/client/vey-gaze-controller";

export interface VeyAnimationOptions {
  motion: VeyMotion;
  expression?: VeyExpression;
  subdued?: boolean;
  intensity: number;
  roundness: number;
  gaze: boolean;
  reduced: boolean;
  still: boolean;
  compact: boolean;
  position: string;
}

export class VeyMotionController {
  private readonly model = new VeyMotionModel();
  private readonly expression: VeyFaceModel;
  private readonly gaze: VeyGazeController;
  private readonly observer: IntersectionObserver;
  private readonly body: SVGGElement;
  private readonly face: SVGGElement;
  private readonly eyes: SVGGElement;
  private readonly pupils: SVGGElement;
  private readonly happyEyes: SVGGElement;
  private readonly brows: SVGGElement;
  private readonly leftBrow: SVGPathElement;
  private readonly rightBrow: SVGPathElement;
  private readonly leftLid: SVGPathElement;
  private readonly rightLid: SVGPathElement;
  private readonly smile: SVGPathElement;
  private readonly mouth: SVGEllipseElement;
  private readonly left: SVGPathElement;
  private readonly right: SVGPathElement;
  private readonly highlight: SVGPathElement;
  private readonly outline: SVGPathElement;
  private options: VeyAnimationOptions;
  private frame = 0;
  private previous = 0;
  private nextBlink = 0;
  private blinkStarted = -1000;
  private visible = false;
  private level = 0;
  private rounding = 0;
  private transient: { motion: VeyMotion; until: number } | null = null;
  private changed = 0;
  private geometryKey = "";

  constructor(
    private readonly root: HTMLElement,
    options: VeyAnimationOptions,
  ) {
    this.options = options;
    this.expression = new VeyFaceModel(options.expression);
    const part = <T extends SVGElement>(name: string) =>
      root.querySelector<T>(`[data-vey-${name}]`)!;
    this.body = part("body");
    this.face = part("face");
    this.eyes = part("eyes");
    this.pupils = part("pupils");
    this.happyEyes = part("happy-eyes");
    this.brows = part("brows");
    this.leftBrow = part("left-brow");
    this.rightBrow = part("right-brow");
    this.leftLid = part("left-lid");
    this.rightLid = part("right-lid");
    this.smile = part("smile");
    this.mouth = part("mouth");
    this.left = part("left");
    this.right = part("right");
    this.highlight = part("highlight");
    this.outline = part("outline");
    this.gaze = new VeyGazeController(root);
    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.visible = entry.isIntersecting;
        this.sync();
      },
      { threshold: 0.01 },
    );
    this.observer.observe(root);
    document.addEventListener("visibilitychange", this.sync);
    root.addEventListener("pointerdown", this.tap);
    this.update(options);
  }

  update(options: VeyAnimationOptions) {
    const now = performance.now();
    const activated =
      (this.options.still && !options.still) ||
      (this.options.subdued && !options.subdued);
    if (this.options.motion !== options.motion) {
      this.transient = null;
      if (this.options.motion === "error" && options.motion === "thinking")
        this.transient = { motion: "retry", until: now + 550 };
      if (this.options.motion === "thinking" && options.motion === "idle")
        this.transient = { motion: "understood", until: now + 600 };
      this.changed = now;
    }
    this.options = options;
    this.expression.transition(options.expression);
    this.model.transition(
      this.transient?.motion ?? options.motion,
      now,
      activated,
    );
    this.root.dataset.motion = options.motion;
    this.sync();
  }

  private tap = () => {
    if (
      this.options.still ||
      this.options.reduced ||
      ["speaking", "listening", "thinking"].includes(this.options.motion)
    )
      return;
    const now = performance.now();
    this.transient = { motion: "tap", until: now + 550 };
    this.model.transition("tap", now);
    this.blinkStarted = now;
    this.changed = now;
    this.schedule();
  };

  private sync = () => {
    const active = this.visible && !document.hidden;
    this.gaze.enable(
      active &&
        this.options.gaze &&
        !this.options.reduced &&
        !this.options.still,
    );
    if (active) {
      this.schedule();
    } else {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.previous = 0;
    }
  };

  private schedule() {
    if (!this.frame && this.visible && !document.hidden)
      this.frame = requestAnimationFrame(this.render);
  }

  private render = (now: number) => {
    this.frame = 0;
    const {
      reduced,
      still,
      compact,
      intensity,
      roundness,
      motion,
      position,
      subdued,
    } = this.options;
    const quiet = reduced || still;
    const elapsed = this.previous ? Math.min(64, now - this.previous) : 16;
    this.previous = now;
    if (this.transient && now >= this.transient.until) {
      this.transient = null;
      this.model.transition(motion, now);
    }
    const pose = this.model.sample(now, quiet, compact, subdued);
    const expression = this.expression.sample(elapsed, quiet);
    const face = veyFaceGeometry(expression, expression.smile * pose.smile);
    const gaze = this.gaze.sample(elapsed);
    if (!this.nextBlink) this.nextBlink = now + 4000 + Math.random() * 3000;
    if (!quiet && !compact && now >= this.nextBlink) {
      this.blinkStarted = now;
      this.nextBlink = now + 4000 + Math.random() * 3000;
    }
    const blinkTime = now - this.blinkStarted;
    const blink =
      !quiet && blinkTime >= 0 && blinkTime < 170
        ? 1 - Math.sin((blinkTime / 170) * Math.PI) * 0.94
        : 1;
    const speaking =
      (motion === "speaking" || motion === "explaining") && !still;
    const targetLevel = speaking ? Math.max(0, Math.min(1, intensity)) : 0;
    this.level +=
      (targetLevel - this.level) *
      (1 - Math.exp(-elapsed / (targetLevel > this.level ? 35 : 65)));
    if (!speaking) this.level = 0;
    this.rounding +=
      (Math.max(0, Math.min(1, roundness)) - this.rounding) *
      (1 - Math.exp(-elapsed / 65));
    const offsetX =
      position === "mid-left" ? -2.5 : position === "mid-right" ? 2.5 : 0;
    const offsetY = position === "top-mid" ? -2 : 0;
    this.body.setAttribute(
      "transform",
      `translate(${pose.x} ${pose.y}) translate(120 225) rotate(${pose.tilt + gaze.x * 0.35}) scale(${pose.scaleX} ${pose.scaleY}) translate(-120 -225)`,
    );
    this.face.setAttribute(
      "transform",
      `translate(${pose.lookX + gaze.x * 0.35 + offsetX} ${pose.lookY + gaze.y * 0.35 + offsetY})`,
    );
    this.pupils.setAttribute(
      "transform",
      `translate(${gaze.x * 0.65} ${gaze.y * 0.65})`,
    );
    this.eyes.setAttribute(
      "transform",
      `translate(0 179) scale(1 ${pose.eyes * blink}) translate(0 -179)`,
    );
    const joy = Math.max(pose.joy, expression.joy);
    this.pupils.setAttribute("opacity", `${1 - joy}`);
    this.happyEyes.setAttribute("opacity", `${joy}`);
    this.leftLid.setAttribute("d", face.leftLid);
    this.rightLid.setAttribute("d", face.rightLid);
    this.leftBrow.setAttribute("d", face.leftBrow);
    this.rightBrow.setAttribute("d", face.rightBrow);
    this.brows.setAttribute("opacity", `${expression.brows * (1 - joy)}`);
    const opening = Math.max(pose.mouth, expression.mouth, this.level * 1.2);
    this.smile.setAttribute("d", face.smile);
    this.smile.setAttribute("opacity", `${Math.max(0, 1 - opening * 7)}`);
    this.mouth.setAttribute("ry", `${1.5 + opening * 10}`);
    this.mouth.setAttribute("rx", `${10 - this.rounding * 4 + opening * 2}`);
    this.mouth.setAttribute("opacity", `${Math.min(1, opening * 7)}`);
    const geometryKey = `${pose.left.toFixed(2)}:${pose.right.toFixed(2)}`;
    if (this.geometryKey !== geometryKey) {
      const geometry = veyGeometry(pose.left, pose.right);
      this.outline.setAttribute("d", geometry.body);
      this.left.setAttribute("d", geometry.left);
      this.right.setAttribute("d", geometry.right);
      this.highlight.setAttribute("d", geometry.highlight);
      this.geometryKey = geometryKey;
    }
    if (
      !quiet &&
      (!compact || speaking || now - this.changed < 600 || this.transient)
    )
      this.schedule();
  };

  destroy() {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.gaze.destroy();
    document.removeEventListener("visibilitychange", this.sync);
    this.root.removeEventListener("pointerdown", this.tap);
  }
}
