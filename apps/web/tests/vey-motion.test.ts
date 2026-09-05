import { afterEach, describe, expect, it, vi } from "vitest";
import {
  VeyMotionModel,
  veyConversationMotion,
  veyMotionFor,
} from "@veylo/ui-web/domain/vey-motion";
import {
  VeyMotionController,
  type VeyAnimationOptions,
} from "@veylo/ui-web/client/vey-motion-controller";
import { VeyGazeController } from "@veylo/ui-web/client/vey-gaze-controller";
import { VeyFaceModel, veyFaceFor } from "@veylo/ui-web/domain/vey-face";

class ElementStub extends EventTarget {
  readonly dataset: Record<string, string> = {};
  readonly attributes = new Map<string, string>();
  readonly parts = new Map<string, ElementStub>();
  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }
  getAttribute(name: string) {
    return this.attributes.get(name);
  }
  querySelector(name: string) {
    if (!this.parts.has(name)) this.parts.set(name, new ElementStub());
    return this.parts.get(name)!;
  }
  getBoundingClientRect() {
    return { left: 800, top: 600, width: 88, height: 100 };
  }
}

const defaults: VeyAnimationOptions = {
  motion: "idle",
  intensity: 0,
  roundness: 0,
  gaze: false,
  reduced: false,
  still: false,
  compact: false,
  position: "default",
};

function environment() {
  const windowTarget = new EventTarget();
  const documentTarget = Object.assign(new EventTarget(), { hidden: false });
  const frames = new Map<number, FrameRequestCallback>();
  let id = 0;
  let now = 0;
  let intersection: IntersectionObserverCallback;
  const observer = {
    disconnect: vi.fn(),
    observe: vi.fn(() =>
      intersection(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver,
      ),
    ),
  };
  vi.stubGlobal("window", windowTarget);
  vi.stubGlobal("document", documentTarget);
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        intersection = callback;
      }
      observe = observer.observe;
      disconnect = observer.disconnect;
    },
  );
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (frame: number) =>
    frames.delete(frame),
  );
  vi.spyOn(performance, "now").mockImplementation(() => now);
  return {
    frames,
    observer,
    windowTarget,
    documentTarget,
    tick(count = 1) {
      for (let i = 0; i < count; i++) {
        now += 16;
        const batch = [...frames.values()];
        frames.clear();
        batch.forEach((callback) => callback(now));
      }
    },
    visibility(visible: boolean) {
      intersection(
        [{ isIntersecting: visible } as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver,
      );
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Vey state transitions", () => {
  it("keeps operational states ahead of a conflicting facial expression", () => {
    expect(veyMotionFor("speaking", "furious")).toBe("speaking");
    expect(veyMotionFor("error", "excited")).toBe("error");
    expect(veyMotionFor("idle", "furious")).toBe("angry");
    expect(
      veyConversationMotion("listening", false, "", "Where do you live?"),
    ).toBe("question");
    expect(
      veyConversationMotion("listening", true, "", "Where do you live?"),
    ).toBe("listening");
    expect(
      veyConversationMotion("error", false, "Could not hear that answer"),
    ).toBe("misheard");
  });
  it("interrupts a jump from its current pose and settles without a reset", () => {
    const model = new VeyMotionModel();
    model.transition("victory", 100);
    let pose = model.sample(100);
    for (let now = 116; now <= 500; now += 16) pose = model.sample(now);
    expect(pose.y).toBeLessThan(-5);
    model.transition("listening", 500);
    const next = model.sample(516);
    expect(Math.abs(next.y - pose.y)).toBeLessThan(5);
    for (let now = 532; now <= 1700; now += 16) pose = model.sample(now);
    expect(Math.abs(pose.y)).toBeLessThan(0.1);
    expect(pose.scaleY).toBeGreaterThan(0.98);
  });
  it("renders a stable reduced-motion pose without a jump", () => {
    const model = new VeyMotionModel();
    model.transition("victory", 0);
    const first = model.sample(400, true);
    expect(model.sample(1000, true)).toEqual(first);
    expect(first.y).toBe(0);
    expect(first.scaleY).toBe(1);
  });
  it("gives anger short bursts with calm gaps and quiet side cards", () => {
    const active = new VeyMotionModel();
    const side = new VeyMotionModel();
    active.transition("angry", 0);
    side.transition("angry", 0);
    const burst: number[] = [];
    const pause: number[] = [];
    for (let now = 16; now < 4000; now += 16) {
      const pose = active.sample(now);
      const quiet = side.sample(now, false, false, true);
      expect(quiet.x).toBe(0);
      expect(Math.abs(pose.tilt)).toBeLessThan(8);
      if (now > 350 && now < 1000) burst.push(pose.x);
      if (now > 2500) pause.push(pose.x);
    }
    expect(Math.max(...burst) - Math.min(...burst)).toBeGreaterThan(1);
    expect(Math.max(...pause.map(Math.abs))).toBeLessThan(0.01);
  });
  it("keeps different expressions during quiet rendering and blends face changes", () => {
    const angry = veyFaceFor("angry");
    const kind = veyFaceFor("happy");
    const sarcastic = veyFaceFor("skeptical");
    expect(angry.smile).toBeLessThan(0);
    expect(kind.smile).toBeGreaterThan(1);
    expect(sarcastic.leftEye).toBeLessThan(sarcastic.rightEye);
    expect(sarcastic.rightBrowLift).toBeLessThan(sarcastic.leftBrowLift);
    const face = new VeyFaceModel("angry");
    face.transition("happy");
    const first = face.sample(16);
    expect(first.smile).toBeGreaterThan(angry.smile);
    expect(first.smile).toBeLessThan(kind.smile);
    expect(face.sample(16, true)).toEqual(kind);
  });
});

describe("Vey animation lifecycle", () => {
  it("drives the mouth from audio and closes it on interruption", () => {
    const env = environment();
    const root = new ElementStub();
    const controller = new VeyMotionController(
      root as unknown as HTMLElement,
      defaults,
    );
    controller.update({ ...defaults, motion: "speaking", intensity: 0.8 });
    env.tick(20);
    const mouth = root.querySelector("[data-vey-mouth]");
    expect(Number(mouth.getAttribute("ry"))).toBeGreaterThan(8);
    controller.update({ ...defaults, motion: "listening" });
    env.tick();
    expect(Number(mouth.getAttribute("opacity"))).toBe(0);
    controller.destroy();
    expect(env.frames.size).toBe(0);
    expect(env.observer.disconnect).toHaveBeenCalledOnce();
  });
  it("pauses outside the viewport and in a hidden tab, and resumes once", () => {
    const env = environment();
    const controller = new VeyMotionController(
      new ElementStub() as unknown as HTMLElement,
      defaults,
    );
    env.tick(3);
    expect(env.frames.size).toBe(1);
    env.visibility(false);
    expect(env.frames.size).toBe(0);
    env.visibility(true);
    expect(env.frames.size).toBe(1);
    env.documentTarget.hidden = true;
    env.documentTarget.dispatchEvent(new Event("visibilitychange"));
    expect(env.frames.size).toBe(0);
    env.documentTarget.hidden = false;
    env.documentTarget.dispatchEvent(new Event("visibilitychange"));
    expect(env.frames.size).toBe(1);
    controller.destroy();
  });
  it("preserves an angry face through speech and updates static card expressions", () => {
    const env = environment();
    const root = new ElementStub();
    const controller = new VeyMotionController(root as unknown as HTMLElement, {
      ...defaults,
      expression: "angry",
      motion: "angry",
    });
    env.tick(30);
    const frown = root.querySelector("[data-vey-smile]").getAttribute("d");
    const brow = root.querySelector("[data-vey-left-brow]").getAttribute("d");
    controller.update({
      ...defaults,
      expression: "angry",
      motion: "speaking",
      intensity: 0.8,
    });
    env.tick(20);
    expect(root.querySelector("[data-vey-brows]").getAttribute("opacity")).toBe(
      "1",
    );
    expect(root.querySelector("[data-vey-left-brow]").getAttribute("d")).toBe(
      brow,
    );
    expect(
      Number(root.querySelector("[data-vey-mouth]").getAttribute("ry")),
    ).toBeGreaterThan(8);
    controller.update({ ...defaults, expression: "happy", still: true });
    env.tick();
    expect(root.querySelector("[data-vey-smile]").getAttribute("d")).not.toBe(
      frown,
    );
    expect(root.querySelector("[data-vey-brows]").getAttribute("opacity")).toBe(
      "0",
    );
    expect(env.frames.size).toBe(0);
    controller.destroy();
  });
  it("does not run an idle animation loop for reduced motion or static icons", () => {
    for (const option of [
      { reduced: true },
      { still: true },
      { compact: true },
    ]) {
      const env = environment();
      const controller = new VeyMotionController(
        new ElementStub() as unknown as HTMLElement,
        { ...defaults, ...option },
      );
      env.tick(60);
      expect(env.frames.size).toBe(0);
      controller.destroy();
    }
  });
});

describe("Vey cursor gaze", () => {
  it("smooths and bounds the gaze, recenters on exit, and removes listeners", () => {
    const env = environment();
    const gaze = new VeyGazeController(
      new ElementStub() as unknown as HTMLElement,
    );
    gaze.enable(true);
    const move = Object.assign(new Event("pointermove"), {
      pointerType: "mouse",
      clientX: -10000,
      clientY: -10000,
    });
    env.windowTarget.dispatchEvent(move);
    const first = gaze.sample(16);
    expect(first.x).toBeLessThan(0);
    expect(first.x).toBeGreaterThan(-1);
    let settled = first;
    for (let i = 0; i < 100; i++) settled = gaze.sample(16);
    expect(settled.x).toBeGreaterThanOrEqual(-5);
    expect(settled.y).toBeGreaterThanOrEqual(-3.5);
    env.documentTarget.dispatchEvent(new Event("pointerleave"));
    for (let i = 0; i < 100; i++) settled = gaze.sample(16);
    expect(Math.abs(settled.x)).toBeLessThan(0.001);
    gaze.destroy();
    env.windowTarget.dispatchEvent(move);
    expect(Math.abs(gaze.sample(16).x)).toBeLessThan(0.001);
  });
});
