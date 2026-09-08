import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  nativeBootstrapSchema,
  nativeProgressSchema,
  sprintSchema,
} from "@veylo/contracts/schemas/native";
import {
  attemptSchema,
  attemptResultSchema,
  assessmentSchema,
} from "@veylo/contracts/schemas/responses";

config({ path: new URL("../.env.local", import.meta.url), quiet: true });
let db: SupabaseClient;
let user: string;
let token: string;
let other: string;
const base =
  (process.env.NATIVE_API_BASE ?? "http://127.0.0.1:3000") + "/api/v1/ios";
const answers = {
  startingLevel: "unknown",
  targetBand: 7,
  examStatus: "not_booked",
  examDate: null,
  focus: ["reading", "writing"],
  barrier: "private",
};

async function call(path: string, method = "GET", body?: unknown) {
  const response = await fetch(base + path, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
}

beforeAll(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url))
    throw new Error("Native tests require local Supabase");
  db = createClient(url, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });
  const email = "learning-" + randomUUID() + "@ielts.local";
  const password = randomUUID() + "Aa1!";
  const created = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: "Native Learner" },
  });
  if (created.error) throw created.error;
  user = created.data.user.id;
  const second = await db.auth.admin.createUser({
    email: "other-" + randomUUID() + "@ielts.local",
    password,
    email_confirm: true,
  });
  if (second.error) throw second.error;
  other = second.data.user.id;
  const auth = createClient(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
  const session = await auth.auth.signInWithPassword({ email, password });
  if (session.error) throw session.error;
  token = session.data.session!.access_token;
});
afterAll(async () => {
  for (const id of [user, other]) if (id) await db.auth.admin.deleteUser(id);
});

describe("native learning journey", () => {
  it("opens a verified account without invitations and without fabricated progress", async () => {
    const response = await call("/bootstrap");
    expect(response.status, JSON.stringify(response.body)).toBe(200);
    const bootstrap = nativeBootstrapSchema.parse(response.body);
    expect(bootstrap.profile.betaAccess).toBe(true);
    expect(bootstrap.profile.dailyMinutes).toBe(10);
    expect(bootstrap.onboarding.completedAt).toBeNull();
    expect(bootstrap.capabilities.skills).toEqual(["reading", "writing"]);
    expect(bootstrap.capabilities.speakingRecording).toBe(false);
    const progress = nativeProgressSchema.parse(
      (await call("/statistics")).body,
    );
    expect(progress.statistics.history).toEqual([]);
    expect(progress.streak.current).toBe(0);
    expect(
      progress.forecasts.every((value) => value.reason === "insufficient_data"),
    ).toBe(true);
  });
  it("persists onboarding with revisions and an idempotent completion", async () => {
    expect(
      (
        await call("/onboarding", "PATCH", {
          revision: 0,
          step: 5,
          answers: { ...answers, focus: [] },
          complete: true,
        })
      ).status,
    ).toBe(400);
    const input = { revision: 0, step: 5, answers, complete: true };
    const saved = await call("/onboarding", "PATCH", input);
    expect(saved.status, JSON.stringify(saved.body)).toBe(200);
    expect(saved.body.revision).toBe(1);
    expect((await call("/onboarding", "PATCH", input)).body.revision).toBe(1);
    expect(
      (
        await call("/onboarding", "PATCH", {
          ...input,
          answers: { ...answers, targetBand: 8 },
        })
      ).status,
    ).toBe(409);
    expect((await call("/bootstrap")).body.profile.targetBand).toBe(7);
  });
  it("keeps hidden skills and recording endpoints inaccessible", async () => {
    const result = await call("/tasks");
    expect(result.status).toBe(200);
    expect(
      result.body.items.every((item: { task: { skill: string } }) =>
        ["reading", "writing"].includes(item.task.skill),
      ),
    ).toBe(true);
    const speaking = await db
      .from("tasks")
      .select("id")
      .eq("skill", "speaking")
      .limit(1)
      .single();
    if (speaking.error) throw speaking.error;
    expect(
      (
        await call("/attempts", "POST", {
          taskId: speaking.data.id,
          mode: "practice",
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await call("/audio/upload-ticket", "POST", {
          attemptId: randomUUID(),
          questionIndex: 0,
          bytes: 100,
        })
      ).status,
    ).toBe(404);
  });
  it("checks Reading from keys, protects draft revisions and keeps the daily plan stable", async () => {
    const firstPlan = await call("/dashboard");
    const tasks = await call("/tasks?skill=reading");
    const task = tasks.body.items[0].task;
    const created = await call("/attempts", "POST", {
      taskId: task.id,
      mode: "practice",
    });
    expect(created.status, JSON.stringify(created.body)).toBe(200);
    const attempt = attemptSchema.parse(created.body);
    expect(attempt.client).toBe("ios");
    expect(
      (await call("/attempts", "POST", { taskId: task.id, mode: "practice" }))
        .body.id,
    ).toBe(attempt.id);
    const reading = Object.fromEntries(
      task.readingQuestions.map(
        (question: { number: number; options: { value: string }[] }) => [
          question.number,
          question.options[0]?.value ?? "test",
        ],
      ),
    );
    const save = await call("/attempts/" + attempt.id, "PATCH", {
      revision: 0,
      answer: { text: "", reading, audioIds: [] },
    });
    expect(save.status, JSON.stringify(save.body)).toBe(200);
    expect(
      (
        await call("/attempts/" + attempt.id, "PATCH", {
          revision: 0,
          answer: { text: "conflict", reading: {}, audioIds: [] },
        })
      ).status,
    ).toBe(409);
    const notes = {
      revision: 0,
      flaggedQuestions: [task.readingQuestions[0].number],
      highlights: [task.paragraphs[0].text],
    };
    expect(
      (await call("/attempts/" + attempt.id + "/notes", "PATCH", notes)).status,
    ).toBe(200);
    const submitted = await call(
      "/attempts/" + attempt.id + "/submit",
      "POST",
      {},
    );
    expect(submitted.status, JSON.stringify(submitted.body)).toBe(200);
    const assessment = assessmentSchema.parse(submitted.body);
    expect(assessment.provider).toBe("deterministic");
    expect(assessment.reading).toHaveLength(task.readingQuestions.length);
    expect(
      (await call("/attempts/" + attempt.id + "/submit", "POST", {})).body.id,
    ).toBe(assessment.id);
    attemptResultSchema.parse((await call("/attempts/" + attempt.id)).body);
    const secondPlan = await call("/dashboard");
    expect(
      secondPlan.body.tasks.map(
        (item: { task: { id: string } }) => item.task.id,
      ),
    ).toEqual(
      firstPlan.body.tasks.map(
        (item: { task: { id: string } }) => item.task.id,
      ),
    );
    const foreignAttempt = await db.rpc("create_native_attempt", {
      p_user: other,
      p_task: task.id,
      p_mode: "practice",
      p_model: "GigaChat-2-Max",
    });
    if (foreignAttempt.error) throw foreignAttempt.error;
    expect((await call("/attempts/" + foreignAttempt.data.id)).status).toBe(
      404,
    );
  });
  it("keeps unavailable Writing assessment honest and pins GigaChat provenance", async () => {
    const tasks = await call("/tasks?skill=writing");
    const created = await call("/attempts", "POST", {
      taskId: tasks.body.items[0].task.id,
      mode: "practice",
    });
    expect(created.status).toBe(200);
    const id = created.body.id;
    const saved = await call("/attempts/" + id, "PATCH", {
      revision: 0,
      answer: { text: "A short practice response.", reading: {}, audioIds: [] },
    });
    expect(saved.status).toBe(200);
    const submitted = await call("/attempts/" + id + "/submit", "POST", {});
    expect(submitted.status, JSON.stringify(submitted.body)).toBe(200);
    expect(submitted.body.provider).toBe("gigachat");
    expect(submitted.body.requestedModel).toBe("GigaChat-2-Max");
    expect(submitted.body.band).toBeNull();
    expect(submitted.body.status).toBe("unavailable");
  });
  it("runs a server-scored sprint and rejects answer replacement", async () => {
    const id = randomUUID();
    const started = await call("/word-sprints", "POST", { id });
    expect(started.status, JSON.stringify(started.body)).toBe(200);
    const sprint = sprintSchema.parse(started.body);
    expect(sprint.lives).toBe(3);
    expect(sprint.total).toBe(10);
    const body = {
      questionId: sprint.question!.id,
      answer: "deliberately incorrect",
    };
    const answered = await call("/word-sprints/" + id, "POST", body);
    expect(answered.status, JSON.stringify(answered.body)).toBe(200);
    expect(answered.body.lives).toBe(2);
    expect((await call("/word-sprints/" + id, "POST", body)).body.lives).toBe(
      2,
    );
    expect(
      (
        await call("/word-sprints/" + id, "POST", {
          ...body,
          answer: "replacement",
        })
      ).status,
    ).toBe(409);
    let latest = answered.body;
    for (let index = 0; index < 2; index++)
      latest = (
        await call("/word-sprints/" + id, "POST", {
          questionId: latest.question.id,
          answer: "incorrect",
        })
      ).body;
    expect(latest.finished).toBe(true);
    expect(latest.lives).toBe(0);
    expect(latest.question).toBeNull();
  });
});
