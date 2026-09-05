import { mkdir } from "node:fs/promises";
import { test } from "./fixtures";
import { expect } from "@playwright/test";

const screens = [
  { name: "dashboard", path: "/" },
  { name: "statistics-reading", path: "/statistics?tab=reading" },
  { name: "statistics-overview", path: "/statistics?tab=overview" },
  { name: "tests-reading", path: "/tests/reading" },
  { name: "ai", path: "/ai" },
  { name: "vocabulary", path: "/vocabulary" },
  { name: "arcade", path: "/arcade" },
];

test("capture real platform views for the public feature gallery", async ({
  page,
  learner,
}, info) => {
  test.skip(
    info.project.name !== "chrome",
    "One consistent browser supplies the product gallery",
  );
  expect(learner).toBeTruthy();
  await mkdir("public/previews", { recursive: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [kind, width, height] of [
    ["desktop", 1440, 1000],
    ["mobile", 390, 844],
  ] as const) {
    await page.setViewportSize({ width, height });
    for (const screen of screens) {
      await page.goto(screen.path);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("main")).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Veylo home", exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `public/previews/${screen.name}-${kind}.png`,
      });
    }
  }
});
