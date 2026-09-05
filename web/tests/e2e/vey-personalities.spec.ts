import { mkdir } from "node:fs/promises";
import { expect } from "@playwright/test";
import { test } from "./fixtures";

test("personality cards retain distinct faces, animate, and respect reduced motion", async ({
  page,
  learner,
}, info) => {
  expect(learner).toBeTruthy();
  await page.addInitScript(() =>
    localStorage.setItem("preppy-intro-hidden", "true"),
  );
  await page.goto("/ai");
  const carousel = page.getByRole("group", { name: "Choose a personality" });
  await carousel.scrollIntoViewIfNeeded();
  await mkdir(".local/design-qa/preppy", { recursive: true });
  const faces = new Set<string>();
  for (const label of ["Classic", "Angry", "Kind", "Sarcastic"]) {
    await page
      .getByRole("button", { name: `Go to ${label}`, exact: true })
      .click();
    const card = page.getByRole("button", {
      name: `${label} — Start talking`,
      exact: true,
    });
    const avatar = card.locator(".vey-character");
    await expect(avatar).toHaveAttribute("data-subdued", "false");
    await expect(avatar).toHaveAttribute("data-still", "false");
    const body = avatar.locator("[data-vey-body]");
    const before = await body.getAttribute("transform");
    await expect.poll(() => body.getAttribute("transform")).not.toBe(before);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(avatar).toHaveAttribute("data-still", "true");
    await expect
      .poll(async () => {
        const first = await body.getAttribute("transform");
        await page.waitForTimeout(80);
        return first === (await body.getAttribute("transform"));
      })
      .toBe(true);
    faces.add(
      (await avatar.locator("[data-vey-smile]").getAttribute("d")) ?? "",
    );
    if (label === "Angry") {
      await expect(avatar.locator("[data-vey-brows]")).toHaveAttribute(
        "opacity",
        "1",
      );
      await expect(avatar).toHaveAttribute("data-motion", "angry");
    }
    await page.screenshot({
      path: `.local/design-qa/preppy/${label.toLowerCase()}-${info.project.name}.png`,
      animations: "disabled",
    });
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
  expect(faces.size).toBe(4);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Go to Angry", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await carousel.scrollIntoViewIfNeeded();
  const active = page.locator('.preppy-personality-card[data-active="true"]');
  await expect(active).toHaveCSS("opacity", "1");
  await active.evaluate((element) =>
    Promise.all(element.getAnimations().map((animation) => animation.finished)),
  );
  const bounds = await active.boundingBox();
  const figure = await active.locator("[data-vey-body]").boundingBox();
  expect(bounds).toBeTruthy();
  expect(figure).toBeTruthy();
  expect(figure!.x).toBeGreaterThan(bounds!.x);
  expect(figure!.y).toBeGreaterThan(bounds!.y);
  expect(figure!.y + figure!.height).toBeLessThan(bounds!.y + bounds!.height);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `.local/design-qa/preppy/angry-mobile-${info.project.name}.png`,
    animations: "disabled",
  });
});
