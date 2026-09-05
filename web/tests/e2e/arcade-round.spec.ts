import { expect } from "@playwright/test";
import { test } from "./fixtures";

test("runner supports keyboard answers, completion, replay and exit", async ({
  page,
  learner,
}) => {
  expect(learner).toBeTruthy();
  await page.goto("/arcade");
  await page
    .getByRole("button", { name: "Play IELTS Runner", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "30 sec", exact: true }).click();
  await dialog.getByRole("button", { name: "Start", exact: true }).click();
  for (const [key, answer] of [
    ["1", "crucial"],
    ["2", "being"],
    ["3", "numerous"],
    ["1", "increase"],
    ["2", "However"],
    ["3", "permanent"],
    ["2", "would"],
    ["3", "decrease"],
  ]) {
    await expect(
      dialog.locator(`#runner-answer-${Number(key) - 1}`),
    ).toContainText(answer);
    await page.keyboard.press(key);
  }
  await expect(
    dialog.getByRole("heading", { name: "Round complete", exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText("8 points · 8 questions", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText("Today's flame is lit", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".streak-celebration")).toContainText(
    "Today's flame is lit!",
  );
  await expect(page.locator(".streak-nav strong")).toHaveText("1");
  await dialog.getByRole("button", { name: "Play again", exact: true }).click();
  await expect(dialog.locator("#runner-answer-0")).toContainText("crucial");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await page.goto("/");
  await expect(page.locator(".daily-streak h2")).toHaveText("1 day in a row");
});
