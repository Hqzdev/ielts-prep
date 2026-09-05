import { expect } from "@playwright/test";
import { test, db } from "./fixtures";

export function registerNoSpeechTest(sample: "silence" | "noise") {
  test(`arcade setup with the ${sample} fixture does not create a practice session`, async ({
    page,
    learner,
  }) => {
    await page.goto("/arcade");
    await page
      .getByRole("button", { name: "Play Speaking Challenge", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Leave game", exact: true }).click();
    await expect(page).toHaveURL(/\/arcade$/);
    const { data } = await db
      .from("arcade_sessions")
      .select("id")
      .eq("user_id", learner);
    expect(data).toHaveLength(0);
  });
}
