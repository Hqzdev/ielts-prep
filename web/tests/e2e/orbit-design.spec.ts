import { expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { test } from "./fixtures";

const screens = [
  { name: "dashboard", path: "/", heading: "Your plan for today" },
  {
    name: "statistics-history",
    path: "/statistics?tab=history",
    heading: "Statistics",
  },
  {
    name: "statistics-overview",
    path: "/statistics?tab=overview",
    heading: "Statistics",
  },
  {
    name: "statistics-reading",
    path: "/statistics?tab=reading",
    heading: "Statistics",
  },
  { name: "vocabulary", path: "/vocabulary", heading: "Vocabulary" },
  { name: "ai", path: "/ai", heading: "Vey AI" },
  { name: "arcade", path: "/arcade", heading: "Arcade" },
  { name: "account", path: "/account", heading: "Profile" },
  {
    name: "tests-reading",
    path: "/tests/reading",
    heading: "IELTS Mock Tests",
  },
];

test("Veylo screens render without overflow at target viewports", async ({
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
  await mkdir(".local/design-qa", { recursive: true });
  for (const [width, height] of [
    [768, 1024],
    [1280, 900],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    for (const screen of screens) {
      await page.goto(screen.path);
      await expect(
        page
          .getByRole("heading", { name: screen.heading, exact: true })
          .first(),
      ).toBeVisible();
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(overflow).toBe(false);
      await expect(page.locator("img[src*='/brand/']")).toHaveCount(0);
      await expect(
        page.getByText(
          /Spark AI|Orbit AI|Time with Spark|Time with Orbit|Meet your new Orbit|ORBIT.S PICK|SPARK.S PICK/i,
        ),
      ).toHaveCount(0);
      await expect(page.locator(".vey-character").first()).toBeVisible();
      if (screen.name === "dashboard") {
        const banner = await page.locator(".orbit-exam-card").boundingBox();
        for (const selector of [".orbit-exam-copy", ".orbit-band-journey", ".orbit-exam-caption"]) {
          const content = await page.locator(selector).boundingBox();
          expect(content!.y).toBeGreaterThanOrEqual(banner!.y);
          expect(content!.y + content!.height).toBeLessThanOrEqual(banner!.y + banner!.height);
        }
      }
      {
        await page.screenshot({
          path: `.local/design-qa/${screen.name}-${testInfo.project.name}-${width}.png`,
          fullPage: true,
        });
      }
    }
  }
  expect(browserErrors).toEqual([]);
});

test("profile settings persist and supply the current-band fallback", async ({
  page,
  learner,
}) => {
  expect(learner).toBeTruthy();
  await page.goto("/account");
  await page.getByRole("button", { name: "Edit Name", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("Updated learner");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Updated learner", exact: true }),
  ).toBeVisible();
  await page
    .getByText("Study schedule and current level", { exact: true })
    .click();
  await expect(page.locator('select[name="selfReportedBand"]')).toBeVisible();
  expect(
    (await page.locator('select[name="selfReportedBand"]').boundingBox())!
      .height,
  ).toBeGreaterThanOrEqual(44);
  await page.locator('select[name="selfReportedBand"]').selectOption("6");
  await page.getByLabel("Study time per day", { exact: true }).fill("35");
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .click();
  await expect(
    page.getByText("Settings saved. Sessions you have started stay in place.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByText("Study schedule and current level", { exact: true })
    .click();
  await expect(page.locator('select[name="selfReportedBand"]')).toHaveValue(
    "6",
  );
  await expect(
    page.getByLabel("Study time per day", { exact: true }),
  ).toHaveValue("35");
  await page.goto("/");
  await expect(page.locator(".orbit-band-current").first()).toContainText(
    "6.0",
  );
});

test("statistics filters and vocabulary search update visible state", async ({
  page,
  learner,
}) => {
  expect(learner).toBeTruthy();
  await page.goto("/statistics?tab=history");
  const writing = page.getByRole("button", { name: "Writing", exact: true });
  await writing.click();
  await expect(writing).toHaveAttribute("aria-pressed", "true");
  await page.goto("/statistics?tab=reading");
  await page.getByRole("link", { name: "Week", exact: true }).click();
  await expect(page).toHaveURL(/period=week/);
  await expect(
    page.getByRole("link", { name: "Week", exact: true }),
  ).toHaveAttribute("aria-current", "true");
  await page.getByRole("link", { name: "Writing", exact: true }).click();
  await expect(page).toHaveURL(/tab=writing&period=week/);
  await page.goto("/vocabulary");
  await page
    .getByLabel("Search vocabulary", { exact: true })
    .fill("rehabilitation");
  await expect(page.locator(".orbit-word-list article")).toHaveCount(1);
  await expect(page.locator(".orbit-word-list article")).toContainText(
    "rehabilitation",
  );
});

test("Reference navigation supports mobile keyboard access and administrator routes", async ({
  page,
  learner,
}) => {
  const { db } = await import("./fixtures");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Open navigation" });
  await menu.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(menu).toBeFocused();
  await menu.click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Vocabulary", exact: true })
    .click();
  await expect(page).toHaveURL(/\/vocabulary$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await menu.click();
  await expect(
    page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "Vocabulary", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");
  await db.from("profiles").update({ role: "admin" }).eq("id", learner);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.reload();
  await expect(
    page
      .getByRole("navigation", { name: "Main navigation", exact: true })
      .getByRole("link", { name: "Master Tool" }),
  ).toBeVisible();
  await expect(menu).toBeHidden();
  await expect(page.locator(".orbit-sidebar")).toHaveCSS("width", "256px");
  await expect(page.locator(".orbit-sidebar")).toHaveCSS("position", "fixed");
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page.locator(".orbit-sidebar")).toHaveCSS("width", "256px");
  await expect(menu).toBeHidden();
  await expect(
    page.getByRole("link", { name: "Vocabulary", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("link", { name: "Master Tool" }).click();
  await expect(
    page.getByRole("heading", { name: "Administrator", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: ".local/design-qa/admin-mobile-390.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("Reference fonts, reduced motion and narrow layouts remain usable", async ({
  page,
  learner,
}, testInfo) => {
  expect(learner).toBeTruthy();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const screen of screens) {
    await page.goto(screen.path);
    await page.waitForLoadState("networkidle");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const motion = page
      .locator(".vey-character:visible")
      .first();
    await expect(motion).toHaveCSS("animation-name", "none");
    await expect(page.locator("body")).toHaveCSS("font-family", /bodyFont/);
    await expect(page.locator(".orbit-sidebar")).toHaveCSS(
      "box-shadow",
      "none",
    );
    await page.screenshot({
      path: `.local/design-qa/${screen.name}-${testInfo.project.name}-390.png`,
      fullPage: true,
    });
  }
});

test("Reference authentication screens keep readable forms on a phone", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send Code", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `.local/design-qa/login-${testInfo.project.name}-390.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Create account", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Get your target score on the first try",
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
