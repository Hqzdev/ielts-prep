import { expect } from "@playwright/test";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { test, db } from "./fixtures";
import { WavCodec } from "../../src/domain/wav";

test.use({
  permissions: ["microphone"],
  launchOptions: {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-audio-capture=${resolve("tests/fixtures/speech-turn.wav")}`,
    ],
  },
});

test("Vey completes hands-free and hold-to-talk turns, retries TTS, and saves subtitles", async ({
  page,
  learner,
}, info) => {
  test.skip(
    info.project.name !== "chrome",
    "The real microphone fixture requires Chromium capture flags",
  );
  await page.addInitScript(() => {
    const capture = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    );
    const tracks: MediaStreamTrack[] = [];
    Object.defineProperty(window, "preppyTrackStates", {
      get: () => tracks.map((track) => track.readyState),
    });
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      const stream = await capture(constraints);
      tracks.push(...stream.getTracks());
      return stream;
    };
  });
  const thread = randomUUID();
  let turn = 0;
  let transcriptions = 0;
  let ttsFailure = false;
  const audio = Buffer.from(
    new WavCodec().encode(
      Float32Array.from(
        { length: 24000 },
        (_, index) => Math.sin((index * 2 * Math.PI * 220) / 16000) * 0.18,
      ),
    ),
  );
  const stream = (text: string) =>
    [
      { type: "thread", threadId: thread, assistantId: randomUUID() },
      { type: "token", text: text.slice(0, 12) },
      { type: "token", text: text.slice(12) },
      { type: "done", status: "complete" },
    ]
      .map((event) => JSON.stringify(event))
      .join("\n") + "\n";
  await page.route("**/api/chat/session", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      personality: "kind",
      explicit: false,
    });
    await route.fulfill({
      contentType: "application/x-ndjson",
      body: stream("Hi, I’m Vey. Where do you live?"),
    });
  });
  await page.route("**/api/chat/audio/transcribe?*", async (route) => {
    const buffer = route.request().postDataBuffer()!;
    const info = new WavCodec().inspect(Uint8Array.from(buffer).buffer);
    expect(info.sampleRate).toBe(16000);
    expect(info.duration).toBeGreaterThanOrEqual(0.3);
    expect(info.duration).toBeLessThanOrEqual(60);
    transcriptions++;
    await route.fulfill({
      json: { text: "I live in a quiet town near the mountains." },
    });
  });
  await page.route("**/api/chat/messages", async (route) => {
    turn++;
    expect(route.request().postDataJSON().threadId).toBe(thread);
    await route.fulfill({
      contentType: "application/x-ndjson",
      body: stream("That sounds peaceful. What do you enjoy about your town?"),
    });
  });
  await page.route("**/api/chat/audio/speak", async (route) => {
    if (ttsFailure) {
      ttsFailure = false;
      await route.fulfill({
        status: 502,
        json: {
          error: {
            message:
              "Your reply is saved, but its audio is unavailable. Retry playback.",
          },
        },
      });
    } else await route.fulfill({ json: { url: "/preppy-test.wav" } });
  });
  await page.route("**/preppy-test.wav", (route) =>
    route.fulfill({ contentType: "audio/wav", body: audio }),
  );
  await page.addInitScript(() => {
    localStorage.setItem("preppy-input-mode", "hold");
    localStorage.setItem("preppy-intro-hidden", "true");
  });
  await page.goto("/ai");
  await page.getByRole("button", { name: "Go to Kind", exact: true }).click();
  await page
    .getByRole("button", { name: "Start talking", exact: true })
    .click();
  await expect(page.getByText("10:00", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Show subtitles" }).click();
  await expect
    .poll(
      () =>
        page
          .locator(".preppy-stage .vey-character")
          .evaluate((element) =>
            Number(
              (element as HTMLElement).style.getPropertyValue("--preppy-level"),
            ),
          ),
      { timeout: 30000 },
    )
    .toBeGreaterThan(0.1);
  await expect(page.getByRole("heading", { name: "Your turn" })).toBeVisible({
    timeout: 30000,
  });
  await expect(page.getByRole("log")).toContainText("Where do you live?");
  ttsFailure = true;
  await page.locator("h1").click();
  await page.keyboard.down("Space");
  await expect(
    page.getByRole("heading", { name: "Listening…", exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(700);
  await page.keyboard.up("Space");
  await expect(page.locator(".preppy-error")).toContainText(
    "audio is unavailable",
  );
  await expect(page.getByRole("log")).toContainText("What do you enjoy");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your turn" })).toBeVisible();
  expect(turn).toBe(1);
  expect(transcriptions).toBe(1);
  await page.getByRole("button", { name: "Hide subtitles" }).click();
  await expect(page.getByRole("log")).toHaveCount(0);
  await page.getByRole("button", { name: "Show subtitles" }).click();
  await expect(page.getByRole("log")).toContainText("quiet town");
  await page.getByRole("button", { name: "Hands-free", exact: true }).click();
  await expect
    .poll(() => transcriptions, { timeout: 30000 })
    .toBeGreaterThan(1);
  await page
    .locator(".preppy-mode-switch")
    .getByRole("button", { name: "Hold to talk", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Your turn" })).toBeVisible();
  await page.clock.install();
  await page.clock.fastForward(600000);
  await expect(
    page.getByRole("heading", { name: "Keep talking next time!" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download text history" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { preppyTrackStates: string[] })
          .preppyTrackStates,
    ),
  ).toEqual(["ended"]);
  const { data } = await db
    .from("audio_assets")
    .select("id")
    .eq("user_id", learner);
  expect(data).toEqual([]);
});

test("Vey respects reduced motion and uses the animated Vey vector character", async ({
  page,
  learner,
}) => {
  expect(learner).toBeTruthy();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ai");
  const animations = await page
    .locator(".preppy-introduction .vey-character")
    .evaluate((element) =>
      [...element.querySelectorAll("*")].map(
        (child) => getComputedStyle(child).animationName,
      ),
    );
  expect(animations.every((name) => name === "none")).toBe(true);
  await expect(
    page.locator(".preppy-introduction img, .preppy-introduction canvas"),
  ).toHaveCount(0);
  await expect(
    page.locator(".preppy-introduction [data-vey-outline], .preppy-introduction [data-vey-left], .preppy-introduction [data-vey-right]"),
  ).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Start talking", exact: true }),
  ).toBeVisible();
});

test("voice API requires authentication and enforces thread, message and WAV boundaries", async ({
  page,
  request,
  learner,
}) => {
  for (const path of [
    "/api/chat/session",
    "/api/chat/audio/speak",
    "/api/chat/audio/welcome",
    `/api/chat/audio/transcribe?thread=${randomUUID()}`,
  ]) {
    expect((await request.post(path, { data: {} })).status()).toBe(401);
  }
  const threadId = randomUUID();
  const otherThreadId = randomUUID();
  const messageId = randomUUID();
  const foreign = await db.auth.admin.createUser({
    email: `preppy-api-${randomUUID()}@ielts.local`,
    password: `${randomUUID()}Aa1!`,
    email_confirm: true,
  });
  if (foreign.error) throw foreign.error;
  try {
    const { error } = await db.from("chat_threads").insert([
      { id: threadId, user_id: learner, title: "API test" },
      {
        id: otherThreadId,
        user_id: foreign.data.user.id,
        title: "Private conversation",
      },
    ]);
    expect(error).toBeNull();
    await db.from("chat_messages").insert({
      id: messageId,
      thread_id: threadId,
      user_id: learner,
      role: "user",
      content: "My answer",
      status: "complete",
    });
    const wav = Buffer.from(new WavCodec().encode(new Float32Array(16000)));
    expect(
      (
        await page.request.post(
          `/api/chat/audio/transcribe?thread=${otherThreadId}`,
          { headers: { "Content-Type": "audio/wav" }, data: wav },
        )
      ).status(),
    ).toBe(404);
    expect(
      (
        await page.request.post(
          `/api/chat/audio/transcribe?thread=${threadId}`,
          { headers: { "Content-Type": "audio/wav" }, data: Buffer.alloc(20) },
        )
      ).status(),
    ).toBe(400);
    expect(
      (
        await page.request.post(
          `/api/chat/audio/transcribe?thread=${threadId}`,
          {
            headers: { "Content-Type": "audio/wav" },
            data: Buffer.alloc(2000000),
          },
        )
      ).status(),
    ).toBe(413);
    expect(
      (
        await page.request.post("/api/chat/audio/speak", {
          data: { threadId: otherThreadId, messageId },
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await page.request.post("/api/chat/audio/speak", {
          data: { threadId, messageId },
        })
      ).status(),
    ).toBe(409);
    expect(
      (
        await page.request.post("/api/chat/audio/speak", {
          data: { threadId, messageId: randomUUID() },
        })
      ).status(),
    ).toBe(404);
    const { data: audio } = await db
      .from("audio_assets")
      .select("id")
      .eq("user_id", learner);
    expect(audio).toEqual([]);
  } finally {
    await db.auth.admin.deleteUser(foreign.data.user.id);
  }
});

test("intro cycles through supportive Vey gestures, carousel supports keys, and Angry requires consent", async ({
  page,
  learner,
}) => {
  expect(learner).toBeTruthy();
  await page.clock.install();
  await page.goto("/ai");
  const avatar = page.locator(".preppy-introduction .vey-character");
  await page.clock.fastForward(4000);
  await expect(avatar).toHaveAttribute("data-motion", "explaining");
  await expect(avatar.locator(".preppy-fire")).toHaveCount(0);
  await page.clock.fastForward(6500);
  await expect(
    page.getByText("Ready when you are", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Don't show again", exact: true })
    .click();
  await page.reload();
  await expect(page.locator(".preppy-introduction")).toHaveCount(0);
  await page.getByRole("group", { name: "Choose a personality" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("button", { name: "Angry — Start talking", exact: true }),
  ).toHaveAttribute("data-active", "true");
  await page
    .getByRole("button", { name: "Start talking", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Heads up before you start",
  );
  await expect(page.getByRole("switch")).toHaveAttribute(
    "aria-checked",
    "false",
  );
  await page.getByRole("switch").click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page
    .getByRole("button", { name: "Start talking", exact: true })
    .click();
  await expect(page.getByRole("switch")).toHaveAttribute(
    "aria-checked",
    "false",
  );
  await page.keyboard.press("Escape");
  await page.screenshot({
    path: ".local/design-qa/preppy/personality-carousel.png",
  });
});

test("floating Vey chat preserves text through network retry and plays a completed reply", async ({
  page,
  learner,
}) => {
  expect(learner).toBeTruthy();
  const threadId = randomUUID();
  const messageId = randomUUID();
  let requests = 0;
  await page.route("**/api/chat/messages", async (route) => {
    requests++;
    if (requests === 1)
      return route.fulfill({
        status: 502,
        json: { error: { message: "Connection failed. Please retry." } },
      });
    expect(route.request().postDataJSON().content).toBe(
      "How can I improve my speaking?",
    );
    await route.fulfill({
      contentType: "application/x-ndjson",
      body:
        [
          { type: "thread", threadId, assistantId: messageId },
          { type: "expression", expression: "happy", position: "center" },
          {
            type: "token",
            text: "Practise one short answer every day. What do you enjoy doing?",
          },
          { type: "done", status: "complete" },
        ]
          .map((event) => JSON.stringify(event))
          .join("\n") + "\n",
    });
  });
  await page.route("**/api/chat/audio/speak", (route) =>
    route.fulfill({ json: { url: "/preppy-chat.wav" } }),
  );
  await page.route("**/api/chat/audio/welcome", (route) =>
    route.fulfill({ json: { url: "/preppy-chat.wav" } }),
  );
  await page.route("**/preppy-chat.wav", (route) =>
    route.fulfill({
      contentType: "audio/wav",
      body: Buffer.from(new WavCodec().encode(new Float32Array(16000))),
    }),
  );
  await page.goto("/vocabulary");
  await page
    .getByRole("button", { name: "Open Vey chat", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Vey", exact: true });
  await expect(dialog.getByRole("textbox")).toBeFocused();
  await dialog.getByRole("button", { name: "Play welcome audio" }).click();
  await expect(dialog.locator("header .vey-character")).toHaveAttribute(
    "data-state",
    "speaking",
  );
  await expect(dialog.locator("header .vey-character")).toHaveAttribute(
    "data-state",
    "idle",
  );
  await dialog.getByRole("textbox").fill("How can I improve my speaking?");
  await dialog.getByRole("textbox").press("Enter");
  await expect(dialog.getByRole("alert")).toContainText("Connection failed");
  await dialog.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(dialog.getByRole("log")).toContainText(
    "Practise one short answer",
  );
  await expect(dialog.locator('[data-role="user"]')).toHaveCount(1);
  await dialog.getByRole("button", { name: "Play audio", exact: true }).click();
  await expect(dialog.locator("header .vey-character")).toHaveAttribute(
    "data-state",
    "speaking",
  );
  await expect(dialog.locator("header .vey-character")).toHaveAttribute(
    "data-state",
    "idle",
  );
  await page.screenshot({ path: ".local/design-qa/preppy/floating-chat.png" });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await page
    .getByRole("button", { name: "Open Vey chat", exact: true })
    .click();
  await expect(dialog.getByRole("log")).toContainText(
    "Practise one short answer",
  );
});

test("floating chat transcribes a voice message and releases the microphone on close", async ({
  page,
  learner,
}, info) => {
  test.skip(info.project.name !== "chrome", "Chromium microphone fixture");
  expect(learner).toBeTruthy();
  await page.addInitScript(() => {
    const capture = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    const tracks: MediaStreamTrack[] = [];
    Object.defineProperty(window, "preppyTrackStates", {
      get: () => tracks.map((track) => track.readyState),
    });
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      const stream = await capture(constraints);
      tracks.push(...stream.getTracks());
      return stream;
    };
  });
  const threadId = randomUUID();
  const response = (text: string) =>
    [
      { type: "thread", threadId, assistantId: randomUUID() },
      { type: "token", text },
      { type: "done", status: "complete" },
    ].map((event) => JSON.stringify(event)).join("\n") + "\n";
  await page.route("**/api/chat/session", (route) => route.fulfill({
    contentType: "application/x-ndjson",
    body: response("How can I help you today?"),
  }));
  let transcriptions = 0;
  await page.route("**/api/chat/audio/transcribe?*", (route) => {
    const audio = route.request().postDataBuffer()!;
    const metadata = new WavCodec().inspect(Uint8Array.from(audio).buffer);
    expect(metadata.sampleRate).toBe(16000);
    expect(metadata.duration).toBeGreaterThanOrEqual(0.3);
    transcriptions++;
    return route.fulfill({ json: { text: "How can I practise my vocabulary?" } });
  });
  await page.route("**/api/chat/messages", (route) => {
    expect(route.request().postDataJSON()).toMatchObject({
      threadId,
      content: "How can I practise my vocabulary?",
    });
    return route.fulfill({
      contentType: "application/x-ndjson",
      body: response("Try reviewing a few words each day."),
    });
  });
  await page.goto("/vocabulary");
  await page.getByRole("button", { name: "Open Vey chat" }).click();
  const dialog = page.getByRole("dialog", { name: "Vey", exact: true });
  await dialog.getByRole("button", { name: "Record a voice message" }).click();
  await expect(dialog.getByRole("textbox")).toHaveAttribute("placeholder", "Recording…");
  await page.waitForTimeout(1200);
  await dialog.getByRole("button", { name: "Send voice message" }).click();
  await expect(dialog.getByRole("log")).toContainText("Try reviewing a few words each day.");
  await expect(dialog.locator('[data-role="user"]')).toHaveText("How can I practise my vocabulary?");
  expect(transcriptions).toBe(1);
  await dialog.getByRole("button", { name: "Record a voice message" }).click();
  await expect(dialog.getByRole("textbox")).toHaveAttribute("placeholder", "Recording…");
  await dialog.getByRole("button", { name: "Close Vey chat" }).click();
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => (window as unknown as {
    preppyTrackStates: string[];
  }).preppyTrackStates)).toEqual(["ended", "ended"]);
  expect(transcriptions).toBe(1);
});

test("microphone rejection is recoverable and changing personality starts a separate session", async ({
  page,
  learner,
}, info) => {
  test.skip(
    info.project.name !== "chrome",
    "The real microphone fixture requires Chromium capture flags",
  );
  expect(learner).toBeTruthy();
  await page.addInitScript(() => {
    localStorage.setItem("preppy-intro-hidden", "true");
    localStorage.setItem("preppy-input-mode", "hold");
    const capture = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    );
    let first = true;
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      if (first) {
        first = false;
        throw new DOMException("Denied", "NotAllowedError");
      }
      return capture(constraints);
    };
  });
  const personalities: string[] = [];
  await page.route("**/api/chat/session", (route) => {
    personalities.push(route.request().postDataJSON().personality);
    return route.fulfill({
      contentType: "application/x-ndjson",
      body:
        [
          { type: "thread", threadId: randomUUID(), assistantId: randomUUID() },
          { type: "token", text: "What do you like about your hometown?" },
          { type: "done", status: "complete" },
        ]
          .map((event) => JSON.stringify(event))
          .join("\n") + "\n",
    });
  });
  await page.route("**/api/chat/audio/speak", (route) =>
    route.fulfill({ json: { url: "/preppy-switch.wav" } }),
  );
  await page.route("**/preppy-switch.wav", (route) =>
    route.fulfill({
      contentType: "audio/wav",
      body: Buffer.from(new WavCodec().encode(new Float32Array(1600))),
    }),
  );
  await page.goto("/ai");
  await page
    .getByRole("button", { name: "Start talking", exact: true })
    .click();
  await expect(page.locator(".preppy-error")).toContainText(
    "Allow microphone access",
  );
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your turn", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Conversation settings" }).click();
  await page.getByRole("menuitem", { name: "Kind", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Start a new session?");
  await page.getByRole("button", { name: "Stay here", exact: true }).click();
  expect(personalities).toEqual(["classic"]);
  await page.getByRole("button", { name: "Conversation settings" }).click();
  await page.getByRole("menuitem", { name: "Kind", exact: true }).click();
  await page.getByRole("button", { name: "Yes, switch", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your turn", exact: true }),
  ).toBeVisible();
  expect(personalities).toEqual(["classic", "kind"]);
  await page.screenshot({ path: ".local/design-qa/preppy/voice-session.png" });
  await page
    .getByRole("button", { name: "End conversation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Back to Vey", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Kind — Start talking", exact: true }),
  ).toBeVisible();
});
