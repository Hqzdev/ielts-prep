import { expect } from "@playwright/test";
import { resolve } from "node:path";
import { test, db } from "./fixtures";

test.use({
  permissions: ["microphone"],
  launchOptions: {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-audio-capture=${resolve("tests/fixtures/speech.wav")}`,
    ],
  },
});

test("Speaking records real browser audio and stores a playable WAV", async ({
  page,
  learner,
}, info) => {
  test.skip(
    info.project.name !== "chrome",
    "Fake microphone input uses Chromium flags",
  );
  await page.goto("/tests/speaking");
  await page.locator(".orbit-test-grid article button").first().click();
  await page.getByRole("button", { name: "Start task", exact: true }).click();
  await expect(page).toHaveURL(/\/practice\//);
  await page
    .getByRole("button", { name: "Connect microphone", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Play question", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.getByText("Your speech is being detected", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Play question", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "I've read the question — continue",
      exact: true,
    })
    .click();
  await expect(page.getByText(/Recording · speech detected/)).toBeVisible();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Speaking is paused", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Resume Speaking", exact: true })
    .click();
  await expect
    .poll(async () => {
      const parts = (await page.locator(".record-timer").innerText())
        .split(":")
        .map(Number);
      return parts[0] * 60 + parts[1];
    })
    .toBeGreaterThanOrEqual(2);
  await page
    .getByRole("button", { name: "I've finished my answer", exact: true })
    .click();
  await expect(page.getByText(/Answers recorded: 1 of/)).toBeVisible();
  const { data: recordings, error } = await db
    .from("audio_assets")
    .select("id,state,duration,bytes,path")
    .eq("user_id", learner);
  expect(error).toBeNull();
  expect(recordings).toHaveLength(1);
  expect(recordings![0].state).toBe("ready");
  expect(recordings![0].duration).toBeGreaterThan(0.2);
  const response = await page.request.get(`/api/v1/audio/${recordings![0].id}`);
  expect(response.ok()).toBe(true);
  const body = await response.json();
  expect((await page.request.get(body.url)).ok()).toBe(true);
});

test("arcade setup stays local", async ({ page, learner }) => {
  await page.goto("/arcade");
  await page
    .getByRole("button", { name: "Play Speak or Die", exact: true })
    .click();
  await expect(page).toHaveURL(/\/arcade$/);
  const { data } = await db
    .from("arcade_sessions")
    .select("id")
    .eq("user_id", learner);
  expect(data).toHaveLength(0);
});
