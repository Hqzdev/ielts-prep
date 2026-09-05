import { test, expect } from "@playwright/test";

test("landing assets, feature tabs and public links work at desktop and mobile sizes", async ({
  page,
}, info) => {
  for (const width of [1920, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: 1080 });
    await page.goto("/welcome");
    await expect(
      page.getByRole("heading", {
        name: "Get the band score you want — on your first try",
      }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Vocabulary", exact: true }).click();
    await expect(
      page.getByRole("tab", { name: "Vocabulary", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await page
      .getByRole("tab", { name: "Vocabulary", exact: true })
      .press("ArrowLeft");
    await expect(
      page.getByRole("tab", { name: "Arcade", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await page
      .getByText("Can I cancel my subscription?", { exact: true })
      .click();
    await expect(
      page.getByText(/Veylo currently uses invitation access/),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect
      .poll(() =>
        page
          .locator("img")
          .evaluateAll((images) =>
            images
              .filter(
                (image) =>
                  image instanceof HTMLImageElement &&
                  (!image.complete || image.naturalWidth === 0),
              )
              .map((image) => image.getAttribute("src")),
          ),
      )
      .toEqual([]);
    await page.screenshot({
      path: `.local/design-qa/landing-${info.project.name}-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("link", { name: "Privacy", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Privacy", exact: true }),
  ).toBeVisible();
});

test("registration answers persist and reach the email form", async ({
  page,
}) => {
  await page.goto("/quiz?step=0");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Bachelor's", exact: true }).click();
  await page.getByRole("button", { name: "First Time", exact: true }).click();
  await page.getByRole("button", { name: "8.0", exact: true }).click();
  await page.getByRole("button", { name: "Speaking", exact: true }).click();
  await page.getByRole("button", { name: "1–3 Months", exact: true }).click();
  await page.getByRole("button", { name: /1 Hour Full Practice/ }).click();
  await page
    .getByRole("button", { name: "Lack Confidence", exact: true })
    .click();
  await page.getByLabel("Your name", { exact: true }).fill("Alex");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "We already know what you need",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText("Band 8.0", { exact: true })).toBeVisible();
  await expect(page.getByText("60 mins", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your plan is ready!" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create account", exact: true }),
  ).toBeDisabled();
});
