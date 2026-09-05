import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ArcadeRoundController } from "@/client/arcade-round-controller";

let nextFrame: FrameRequestCallback;
let now = 0;
let stopped = false;
let closed = false;
let samples = 0.08;
let controller: ArcadeRoundController;

beforeEach(() => {
  now = 0;
  stopped = false;
  closed = false;
  samples = 0.08;
  vi.stubGlobal("performance", { now: () => now });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    nextFrame = callback;
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia: async () => ({
        getTracks: () => [
          {
            stop: () => {
              stopped = true;
            },
          },
        ],
      }),
    },
  });
  vi.stubGlobal(
    "AudioContext",
    class {
      state = "running";
      resume = async () => {};
      close = async () => {
        closed = true;
        this.state = "closed";
      };
      createMediaStreamSource = () => ({ connect: () => {} });
      createAnalyser = () => ({
        fftSize: 1024,
        getFloatTimeDomainData: (values: Float32Array) => values.fill(samples),
      });
    },
  );
  controller = new ArcadeRoundController();
});
afterEach(async () => {
  await controller.destroy();
  vi.unstubAllGlobals();
});
function advance(seconds: number) {
  for (let index = 0; index < seconds * 10; index++) {
    now += 100;
    nextFrame(now);
    if (controller.getSnapshot().phase !== "playing") break;
  }
}
it("ends a timed round and releases microphone resources", async () => {
  await controller.start("challenge", 30, 3);
  advance(31);
  expect(controller.getSnapshot().phase).toBe("finished");
  expect(controller.getSnapshot().speechSeconds).toBeCloseTo(30, 0);
  expect(stopped).toBe(true);
  expect(closed).toBe(true);
});
it("ends survival after silence and keeps the speaking duration", async () => {
  await controller.start("survival", 60, 3);
  advance(4);
  samples = 0;
  advance(4);
  expect(controller.getSnapshot().phase).toBe("finished");
  expect(controller.getSnapshot().speechSeconds).toBeCloseTo(4, 0);
  expect(stopped).toBe(true);
});
it("ignores answers after a runner round ends", async () => {
  await controller.start("runner", 30, 3);
  controller.answer(true);
  controller.finish();
  controller.answer(true);
  expect(controller.getSnapshot().score).toBe(1);
});
it("ends on wall-clock time after the browser suspends animation frames", async () => {
  await controller.start("runner", 30, 3);
  now = 31000;
  nextFrame(now);
  expect(controller.getSnapshot().phase).toBe("finished");
  expect(controller.getSnapshot().elapsed).toBe(30);
});
it("releases a microphone that connects after leaving", async () => {
  let connect: (value: unknown) => void = () => {};
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia: () =>
        new Promise((resolve) => {
          connect = resolve;
        }),
    },
  });
  const pending = controller.start("challenge", 30, 3);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await controller.destroy();
  connect({
    getTracks: () => [
      {
        stop: () => {
          stopped = true;
        },
      },
    ],
  });
  await pending;
  expect(stopped).toBe(true);
  expect(closed).toBe(true);
});
