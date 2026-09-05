import { expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { test, db } from "./fixtures";
import { addDays, localDate } from "../../src/domain/planner";

test("streak API counts completed rounds once and rejects incomplete or fabricated duration", async ({
  page,
  learner,
  request,
}) => {
  expect(learner).toBeTruthy();
  expect((await request.get("/api/streak")).status()).toBe(401);
  expect(await (await page.request.get("/api/streak")).json()).toMatchObject({
    current: 0,
    todayComplete: false,
  });
  const incomplete = await (
    await page.request.post("/api/arcade-rounds", {
      data: { game: "runner", duration: 30 },
    })
  ).json();
  const short = await page.request.post(`/api/arcade-rounds/${incomplete.id}`, {
    data: { elapsed: 0, speechSeconds: 0, answers: 0 },
  });
  expect(await short.json()).toMatchObject({ saved: true, completed: false });
  const round = await (
    await page.request.post("/api/arcade-rounds", {
      data: { game: "runner", duration: 30 },
    })
  ).json();
  const invalid = await page.request.post(`/api/arcade-rounds/${round.id}`, {
    data: { elapsed: 30, speechSeconds: 0, answers: 1 },
  });
  expect(invalid.status()).toBe(400);
  const results = await Promise.all(
    Array.from({ length: 2 }, () =>
      page.request.post(`/api/arcade-rounds/${round.id}`, {
        data: { elapsed: 0, speechSeconds: 0, answers: 8 },
      }),
    ),
  );
  for (const result of results)
    expect(await result.json()).toMatchObject({ saved: true, completed: true });
  expect(await (await page.request.get("/api/streak")).json()).toMatchObject({
    current: 1,
    best: 1,
    todayComplete: true,
  });
  expect(
    (
      await db
        .from("learning_days")
        .select("activity_date")
        .eq("user_id", learner)
    ).data,
  ).toHaveLength(1);
  expect(
    (
      await page.request.post(`/api/arcade-rounds/${randomUUID()}`, {
        data: { elapsed: 0, speechSeconds: 0, answers: 8 },
      })
    ).status(),
  ).toBe(404);
});

test("all streak surfaces share the same local series regardless of statistics period", async ({
  page,
  learner,
}, info) => {
  const today = localDate("Asia/Yekaterinburg");
  const { error } = await db.from("learning_days").insert(
    Array.from({ length: 5 }, (_, index) => ({
      user_id: learner,
      activity_date: addDays(today, index - 4),
      timezone: "Asia/Yekaterinburg",
      source_kind: "practice",
      source_id: randomUUID(),
      earned_at: new Date().toISOString(),
    })),
  );
  expect(error).toBeNull();
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of [
      "/",
      "/statistics?tab=overview&period=week",
      "/statistics?tab=overview&period=all",
    ]) {
      await page.goto(path);
      await expect(page.locator(".daily-streak h2")).toHaveText(
        "5 days in a row",
      );
      await expect(page.locator(".streak-nav strong")).toHaveText("5");
      await expect(page.locator(".streak-week li")).toHaveCount(7);
      await expect(
        page.locator(".streak-heading .streak-flame"),
      ).toHaveAttribute("data-lit", "true");
      await page.waitForLoadState("networkidle");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const icon = page.locator(".streak-heading img");
      expect(
        await icon.evaluate((node) => (node as HTMLImageElement).naturalWidth),
      ).toBeGreaterThan(0);
      if (path === "/" || path.includes("period=week"))
        await page.screenshot({
          path: `.local/design-qa/streak-${path === "/" ? "home" : "statistics"}-${info.project.name}-${width}.png`,
          fullPage: true,
        });
    }
  }
});
