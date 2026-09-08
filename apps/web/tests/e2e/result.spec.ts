import { expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { test, db } from "./fixtures";
import type { Task } from "@veylo/backend/domain/task";

test("renders the band, exact quotations and corrections from a stored assessment", async ({
  page,
  learner,
}, info) => {
  const text =
    "Many students uses social media to find information. Schools should teach them to compare sources. This is very very important for their future. A practical lesson could ask students to check the evidence behind a popular claim.";
  const headers = {
    Origin: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
  };
  const created = await page.request.post("/api/v1/attempts", {
    headers,
    data: { taskId: "w2-001", mode: "practice" },
  });
  const attempt = await created.json();
  await page.request.patch(`/api/v1/attempts/${attempt.id}`, {
    headers,
    data: {
      revision: attempt.revision,
      answer: { text, reading: {}, audioIds: [] },
    },
  });
  await page.request.post(`/api/v1/attempts/${attempt.id}/submit`, {
    headers,
    data: {},
  });
  const grade = {
    sufficientEvidence: true,
    insufficientReason: null,
    criteria: [
      {
        key: "task_response",
        label: "Task Response",
        score: 6.5,
        explanation:
          "Your position is clear. Develop the example in more detail.",
      },
      {
        key: "coherence",
        label: "Coherence & Cohesion",
        score: 7,
        explanation: "The ideas follow a logical order.",
      },
      {
        key: "vocabulary",
        label: "Lexical Resource",
        score: 6,
        explanation: "Some repeated words could be removed.",
      },
      {
        key: "grammar",
        label: "Grammatical Range & Accuracy",
        score: 6.5,
        explanation: "Check subject–verb agreement.",
      },
    ],
    errors: [
      {
        category: "grammar",
        subcategory: "subject-verb agreement",
        issue: "A plural subject takes a verb without the -s ending.",
        correction: "Many students use social media",
        anchor: { type: "text", quote: "Many students uses social media" },
      },
      {
        category: "vocabulary",
        subcategory: "repetition",
        issue:
          "Repeating very adds little meaning. Choose a more precise word.",
        correction: "This is essential for their future.",
        anchor: {
          type: "text",
          quote: "This is very very important for their future.",
        },
      },
    ],
    strengths: [
      "You suggest a specific classroom activity: comparing the evidence behind a popular claim.",
    ],
    nextFocus:
      "Develop one example: explain how students would check a source and what conclusion they would draw.",
    fulfilledRequirements: [],
  };
  const updated = await db
    .from("assessments")
    .update({
      status: "ready",
      band: 6.5,
      grade,
      model: "visual-test-fixture",
      completed_at: new Date().toISOString(),
    })
    .eq("attempt_id", attempt.id)
    .eq("user_id", learner);
  expect(updated.error).toBeNull();
  await page.goto(`/results/${attempt.id}`);
  await expect(page.locator(".band-number")).toContainText("6.5");
  await expect(page.locator(".correction-grid").first()).toBeVisible();
  const correction = await page
    .locator(".correction-grid")
    .first()
    .boundingBox();
  expect(correction!.width).toBeGreaterThan(800);
  await expect(
    page.getByText("Many students uses social media", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Many students use social media", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Revise answer", exact: true }),
  ).toBeVisible();
  await mkdir(".local/screenshots", { recursive: true });
  await page.screenshot({
    path: `.local/screenshots/band-result-${info.project.name}.png`,
    fullPage: true,
  });
});

test("all Reading layouts and all Task 1 visualizations render usable controls", async ({
  page,
  learner,
}) => {
  expect(learner).toBeTruthy();
  const { data, error } = await db
    .from("tasks")
    .select("current_version,task_versions(version,content)")
    .eq("published", true);
  expect(error).toBeNull();
  const bank = data!.map((row) => ({
    task: row.task_versions.find((v) => v.version === row.current_version)!
      .content as Task,
  }));
  const reading = [
    ...new Map(
      bank
        .filter((e) => e.task.skill === "reading")
        .map((entry) => [entry.task.format, entry.task]),
    ).values(),
  ];
  const visuals = [
    ...new Map(
      bank
        .filter((e) => e.task.visual)
        .map((entry) => [
          entry.task.visual!.chartType + (entry.task.visual!.processKind ?? ""),
          entry.task,
        ]),
    ).values(),
  ];
  for (const task of [...reading, ...visuals]) {
    const response = await page.request.post("/api/v1/attempts", {
      headers: {
        Origin: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
      },
      data: { taskId: task.id, mode: "practice" },
    });
    expect(response.ok()).toBe(true);
    const attempt = await response.json();
    await page.goto(`/practice/${attempt.id}`);
    if (task.skill === "reading") {
      await expect(page.locator(".question")).toHaveCount(
        task.readingQuestions.length,
      );
      await expect(
        page.locator(".question input, .question select").first(),
      ).toBeEnabled();
      if (task.diagram)
        await expect(
          page.locator(".reading-diagram .react-flow__node"),
        ).toHaveCount(task.diagram.nodes.length);
    } else {
      await expect(
        page.getByRole("textbox", { name: "Your answer", exact: true }),
      ).toBeEnabled();
      if (task.visual!.chartType === "process_diagram")
        await expect(
          page.locator(".process-diagram .react-flow__node").first(),
        ).toBeVisible();
      else
        await expect(
          page
            .locator(".task-pane table, .task-pane .recharts-surface")
            .first(),
        ).toBeVisible();
    }
  }
});
