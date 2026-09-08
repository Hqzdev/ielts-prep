import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { db } from "./fixtures";

async function confirmationLink(page: Page, email: string, subject: string) {
  let id = "";
  await expect
    .poll(async () => {
      const response = await page.request.get(
        `http://127.0.0.1:54324/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
      );
      const body = await response.json();
      id =
        (body.messages ?? []).find((message: { Subject: string; ID: string }) =>
          message.Subject.toLowerCase().includes(subject),
        )?.ID ?? "";
      return id;
    })
    .not.toBe("");
  const message = await (
    await page.request.get(`http://127.0.0.1:54324/api/v1/message/${id}`)
  ).json();
  const link = String(message.HTML)
    .match(/href="([^"]+)"/)?.[1]
    ?.replaceAll("&amp;", "&");
  if (!link || !/^http:\/\/(localhost|127\.0\.0\.1):54321\//.test(link))
    throw new Error("Local verification link not found");
  return link;
}

test("verified email registration, onboarding and password recovery", async ({
  page,
}) => {
  const email = `signup-${randomUUID()}@ielts.local`;
  const password = randomUUID() + "Aa1!";
  try {
    await page.goto("/quiz?step=10");
    await expect(
      page.getByRole("heading", { name: "Your plan is ready!", exact: true }),
    ).toBeVisible();
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page
      .getByRole("button", { name: "Use a password", exact: true })
      .click();
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(
      page.getByText(/Check your inbox to verify your email/),
    ).toBeVisible();
    await page.goto(await confirmationLink(page, email, "confirm"));
    await expect(page).toHaveURL(/\/onboarding$/);
    await page
      .getByLabel("What should we call you?", { exact: true })
      .fill("Registration test");
    await page
      .getByRole("button", { name: "Start learning", exact: true })
      .click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/account");
    await page.getByRole("button", { name: "Log out", exact: true }).click();
    await page
      .getByRole("button", { name: "Use a password", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Forgot password?", exact: true })
      .click();
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page
      .getByRole("button", { name: "Send reset link", exact: true })
      .click();
    await expect(page.getByText(/If this account exists/)).toBeVisible();
    await page.goto(await confirmationLink(page, email, "reset"));
    await expect(
      page.getByRole("heading", { name: "Choose a new password", exact: true }),
    ).toBeVisible();
    await page
      .getByLabel("Password", { exact: true })
      .fill(randomUUID() + "NewAa1!");
    await page
      .getByRole("button", { name: "Save password", exact: true })
      .click();
    await expect(page).toHaveURL(/\/$/);
  } finally {
    const user = await db
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (user.data) await db.auth.admin.deleteUser(user.data.id);
    await page.request.delete(
      `http://127.0.0.1:54324/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
    );
  }
});
