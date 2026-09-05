import { expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { test } from "./fixtures";

test("catalog navigation and responsive layout match the redesigned shell", async ({
  page,
  learner,
}, testInfo) => {
  expect(learner).toBeTruthy();
  await page.waitForLoadState("networkidle");
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  await page.goto("/tests/reading");
  await expect(
    page.getByRole("heading", { name: "IELTS Mock Tests", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Writing", exact: true }).click();
  await expect(page).toHaveURL(/\/tests\/writing$/);
  await expect(
    page.getByRole("heading", { name: "Academic Writing Tests", exact: true }),
  ).toBeVisible();
  await page.locator(".orbit-test-grid article button").first().click();
  await expect(
    page.getByRole("heading", {
      name: "Choose your practice mode",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await mkdir(".local/screenshots", { recursive: true });
  for (const [width, height] of [
    [1280, 800],
    [768, 1024],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await expect(page.locator(".orbit-test-grid")).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
    await page.screenshot({
      path: `.local/screenshots/catalog-${testInfo.project.name}-${width}.png`,
      fullPage: true,
    });
  }
  expect(browserErrors).toEqual([]);
});

test("writing survives reload, pauses and creates a linked correction", async ({
  page,
  learner,
}, testInfo) => {
  expect(learner).toBeTruthy();
  await page.goto("/tests/writing/w2-001");
  await page
    .getByRole("button", {
      name: "Start: Information literacy at school",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Start task", exact: true }).click();
  await expect(page).toHaveURL(/\/practice\//);
  let text =
    "Schools should teach students to evaluate online information. This skill helps them compare sources and question unsupported claims.";
  await page
    .getByRole("textbox", { name: "Your answer", exact: true })
    .fill(text);
  await expect(
    page.getByText("All changes saved", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Your answer", exact: true }),
  ).toHaveValue(text);
  await page.context().setOffline(true);
  text += " A classroom exercise can compare the evidence in two reports.";
  await page
    .getByRole("textbox", { name: "Your answer", exact: true })
    .fill(text);
  await expect(
    page.getByText("Offline · local backup", { exact: true }),
  ).toBeVisible();
  await page.context().setOffline(false);
  await page.reload();
  const recovery = page.getByRole("button", {
    name: "Restore",
    exact: true,
  });
  await expect(
    page.getByRole("textbox", { name: "Your answer", exact: true }),
  ).toBeVisible();
  await expect
    .poll(
      async () =>
        (await recovery.isVisible()) ||
        (await page
          .getByRole("textbox", { name: "Your answer", exact: true })
          .inputValue()) === text,
    )
    .toBe(true);
  if (await recovery.isVisible()) await recovery.click();
  await expect(
    page.getByRole("textbox", { name: "Your answer", exact: true }),
  ).toHaveValue(text);
  await expect(
    page.getByText("All changes saved", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Your answer", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Continue", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("textbox", { name: "Your answer", exact: true }),
  ).toBeEnabled();
  await page.screenshot({
    path: `.local/screenshots/writing-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Submit for review", exact: true })
    .click();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page).toHaveURL(/\/results\//);
  await expect(
    page.getByRole("heading", { name: "Answer saved", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".band-number")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Revise answer", exact: true })
    .click();
  await expect(page).toHaveURL(/\/practice\//);
  await expect(
    page.getByRole("textbox", { name: "Your answer", exact: true }),
  ).toHaveValue(text);
});

test("Reading shows an estimated band, evidence and consistent progress", async ({
  page,
  learner,
}, testInfo) => {
  expect(learner).toBeTruthy();
  await page.goto("/tests/reading/rd-021");
  await page.getByRole("button", { name: /^Start:/ }).click();
  await page.getByRole("button", { name: "Start task", exact: true }).click();
  await expect(page).toHaveURL(/\/practice\//);
  await page
    .getByLabel("It should be assessed against realistic goals.", {
      exact: true,
    })
    .check();
  await page.getByLabel("Checking returned equipment", { exact: true }).check();
  await page.getByLabel("Selling new power tools", { exact: true }).check();
  await page.getByRole("button", { name: "Finish task", exact: true }).click();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page).toHaveURL(/\/results\//);
  await expect(page.locator(".band-number")).toHaveText("6.5 / 9");
  await expect(
    page.getByText("Estimated band · Reading", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("2 / 3 marks · 66.7% correct", { exact: true }),
  ).toBeVisible();
  const resultUrl = page.url();
  await page.reload();
  await expect(page.locator(".band-number")).toHaveText("6.5 / 9");
  await expect(
    page.getByRole("heading", {
      name: "Mistakes and corrections",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("Correct answer", { exact: true })).toBeVisible();
  await page.getByText("Evidence · paragraph C", { exact: true }).click();
  await expect(
    page.getByText("a check after every return", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `.local/screenshots/reading-result-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.goto("/");
  await expect(page.locator(".orbit-band-current").first()).toContainText("6.5");
  await page.getByRole("link", { name: "Progress", exact: true }).click();
  await page.getByRole("link", { name: "Reading", exact: true }).click();
  await expect(page).toHaveURL(/statistics\?tab=reading/);
  await expect(
    page.getByRole("heading", { name: "Band score trend", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".orbit-chart")).toBeVisible();
  await page.goto("/tests/reading?page=4");
  await expect(
    page
      .locator(".orbit-test-grid article")
      .filter({ hasText: "A library of useful things · 1" }),
  ).toContainText("Completed · Band 6.5");
  await page.goto(resultUrl);
});

test("vocabulary search, Vey voice setup and arcade catalog work", async ({
  page,
  learner,
}, testInfo) => {
  expect(learner).toBeTruthy();
  await page.goto("/vocabulary");
  await expect(page.locator(".orbit-word-bank h2")).toContainText("300");
  await page
    .getByLabel("Search vocabulary", { exact: true })
    .fill("rehabilitation");
  await expect(page.locator(".orbit-word-list article")).toHaveCount(1);
  await page.getByLabel("Search vocabulary", { exact: true }).fill("");
  await page.getByRole("button", { name: /Start review/ }).click();
  await expect(page).toHaveURL(/\/vocabulary\/quiz\//);
  await expect(
    page.getByText("Question 1 of 10", { exact: true }),
  ).toBeVisible();
  await page.goto("/ai");
  await expect(
    page.getByRole("heading", { name: "Vey AI", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start talking", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/ai$/);
  await page.goto("/arcade");
  await expect(
    page.getByRole("heading", {
      name: "Speaking Challenge",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".orbit-game-card")).toHaveCount(3);
  await page.screenshot({
    path: `.local/screenshots/arcade-${testInfo.project.name}.png`,
    fullPage: true,
  });
});
