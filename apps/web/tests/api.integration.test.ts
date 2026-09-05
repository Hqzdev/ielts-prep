import { apiOperations } from "@veylo/contracts/api";
import { errorResponseSchema } from "@veylo/contracts/schemas/responses";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { config } from "dotenv";
import { randomUUID, createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { authoredBank } from "@/content/bank";
import type { Attempt } from "@veylo/backend/domain/attempt";
import { WavCodec } from "@veylo/backend/domain/wav";

config({ path: new URL("../.env.local", import.meta.url), quiet: true });
const base = "http://127.0.0.1:3000";
const userIds: string[] = [];
let db: SupabaseClient;
let cookies: string[] = [];
let clients: SupabaseClient[] = [];
async function call(path: string, method = "GET", body?: unknown, user = 0) {
  const response = await fetch(base + path.replace(/^\/api\//, "/api/v1/"), {
    method,
    headers: {
      Cookie: cookies[user] ?? "",
      Origin: base,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  const route = path.split("?")[0].replace(/^\/api/, "");
  const contract = apiOperations.find(
    (item) =>
      item.method === method.toLowerCase() &&
      new RegExp("^" + item.path.replace(/\{[^}]+\}/g, "[^/]+") + "$").test(
        route,
      ),
  );
  expect(contract, `Contract for ${method} ${route}`).toBeDefined();
  if (response.ok) contract!.response.parse(data);
  else errorResponseSchema.parse(data);
  expect(response.headers.get("X-Request-ID")).toBeTruthy();
  return { status: response.status, data };
}
beforeAll(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url))
    throw new Error("Integration tests require local Supabase");
  db = createClient(url, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });
  cookies = [];
  clients = [];
  for (let i = 0; i < 2; i++) {
    const email = `qa-${randomUUID()}@ielts.local`;
    const password = randomUUID() + "aA1!";
    const created = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error) throw created.error;
    const id = created.data.user.id;
    userIds.push(id);
    await db
      .from("profiles")
      .update({ beta_access: true, onboarded: true, name: `QA ${i}` })
      .eq("id", id);
    const jar = new Map<string, string>();
    const client = createServerClient(
      url,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll: () => [...jar].map(([name, value]) => ({ name, value })),
          setAll: (values) =>
            values.forEach(({ name, value }) => jar.set(name, value)),
        },
      },
    );
    const login = await client.auth.signInWithPassword({ email, password });
    if (login.error) throw login.error;
    cookies.push(
      [...jar].map(([name, value]) => `${name}=${value}`).join("; "),
    );
    clients.push(client);
  }
});
afterAll(async () => {
  if (db)
    for (const id of userIds) {
      const { data } = await db
        .from("audio_assets")
        .select("path")
        .eq("user_id", id);
      if (data?.length)
        await db.storage.from("speaking").remove(data.map((r) => r.path));
      await db.auth.admin.deleteUser(id);
    }
});

describe("authenticated learning flow", () => {
  it("requires an invitation, isolates two learners and never returns Reading keys", async () => {
    expect((await call("/api/tasks", "GET", undefined, 9)).status).toBe(401);
    const catalog = await call("/api/tasks?skill=reading");
    expect(catalog.status).toBe(200);
    expect(catalog.data.total).toBe(46);
    expect(JSON.stringify(catalog.data)).not.toContain('"readingKey"');
    expect(JSON.stringify(catalog.data)).not.toContain('"evidence"');
    const keys = await clients[0].from("reading_keys").select("*");
    expect(keys.error).not.toBeNull();
    const elevate = await clients[0]
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", userIds[0]);
    expect(elevate.error).not.toBeNull();
    const created = await call("/api/attempts", "POST", {
      taskId: "w2-010",
      mode: "practice",
    });
    expect(created.status).toBe(200);
    expect(
      (await call(`/api/attempts/${created.data.id}`, "GET", undefined, 1))
        .status,
    ).toBe(404);
    const rows = await clients[1]
      .from("attempts")
      .select("id")
      .eq("id", created.data.id);
    expect(rows.data).toEqual([]);
    await db
      .from("profiles")
      .update({ beta_access: false })
      .eq("id", userIds[1]);
    expect((await call("/api/tasks", "GET", undefined, 1)).status).toBe(403);
    await db
      .from("profiles")
      .update({ beta_access: true })
      .eq("id", userIds[1]);
  });
  it("saves, detects conflicting versions, submits once and keeps the original when revising", async () => {
    const first = await call("/api/attempts", "POST", {
      taskId: "w2-001",
      mode: "practice",
    });
    const attempt = first.data as Attempt;
    const answer = {
      text: "Information literacy helps students assess online sources.",
      reading: {},
      audioIds: [],
    };
    const save = await call(`/api/attempts/${attempt.id}`, "PATCH", {
      revision: 0,
      answer,
    });
    expect(save.status).toBe(200);
    expect(save.data.revision).toBe(1);
    expect(
      (
        await call(`/api/attempts/${attempt.id}`, "PATCH", {
          revision: 0,
          answer: { ...answer, text: "conflicting" },
        })
      ).status,
    ).toBe(409);
    const submitted = await call(
      `/api/attempts/${attempt.id}/submit`,
      "POST",
      {},
    );
    expect(submitted.status).toBe(200);
    expect(submitted.data.status).toBe("unavailable");
    expect(submitted.data.band).toBeNull();
    const again = await call(`/api/attempts/${attempt.id}/submit`, "POST", {});
    expect(again.data.id).toBe(submitted.data.id);
    expect(
      (
        await call(`/api/attempts/${attempt.id}`, "PATCH", {
          revision: 1,
          answer,
        })
      ).status,
    ).toBe(409);
    const revision = await call(
      `/api/attempts/${attempt.id}/revisions`,
      "POST",
      {},
    );
    expect(revision.status).toBe(200);
    expect(revision.data.parentAttemptId).toBe(attempt.id);
    expect(revision.data.answer.text).toBe(answer.text);
    const original = await call(`/api/attempts/${attempt.id}`);
    expect(original.data.attempt.answer.text).toBe(answer.text);
    expect((await call("/api/tasks?skill=writing")).status).toBe(200);
  });
  it("marks every supported Reading format with its real server-side key", async () => {
    const entries = authoredBank().filter((e) => e.task.skill === "reading");
    const chosen = [...new Set(entries.map((e) => e.task.format))].map(
      (format) => entries.find((e) => e.task.format === format)!,
    );
    for (const entry of chosen) {
      const created = await call("/api/attempts", "POST", {
        taskId: entry.task.id,
        mode: "practice",
      });
      expect(created.status).toBe(200);
      const id = created.data.id;
      const reading = Object.fromEntries(
        entry.readingKey.map((key) => [
          key.number,
          entry.task.readingQuestions.find((q) => q.number === key.number)
            ?.mode === "multiple"
            ? key.answers
            : key.answers[0],
        ]),
      );
      expect(
        (
          await call(`/api/attempts/${id}`, "PATCH", {
            revision: 0,
            answer: { text: "", audioIds: [], reading },
          })
        ).status,
      ).toBe(200);
      const result = await call(`/api/attempts/${id}/submit`, "POST", {});
      expect(result.status).toBe(200);
      expect(result.data.status).toBe("ready");
      expect(result.data.band).toBe(9);
      expect(result.data.rubricVersion).toBe("reading-academic-practice-v1");
      const stored = await db
        .from("assessments")
        .select("band")
        .eq("id", result.data.id)
        .single();
      expect(stored.data?.band).toBe(9);
      expect(
        result.data.reading.every(
          (answer: { correct: boolean }) => answer.correct,
        ),
      ).toBe(true);
    }
  });
  it("rejects edits after a strict deadline and grades the last server draft", async () => {
    const created = await call("/api/attempts", "POST", {
      taskId: "rd-020",
      mode: "strict",
    });
    const id = created.data.id;
    const answer = { text: "", audioIds: [], reading: { "1": "TRUE" } };
    await call(`/api/attempts/${id}`, "PATCH", { revision: 0, answer });
    await db
      .from("attempts")
      .update({ deadline_at: new Date(Date.now() - 1000).toISOString() })
      .eq("id", id);
    const late = await call(`/api/attempts/${id}`, "PATCH", {
      revision: 1,
      answer: { ...answer, reading: { "1": "FALSE" } },
    });
    expect(late.status).toBe(409);
    expect(late.data.error.code).toBe("DEADLINE_EXPIRED");
    const result = await call(`/api/attempts/${id}/result`);
    expect(result.data.attempt.answer.reading["1"]).toBe("TRUE");
    expect(result.data.assessment.status).toBe("ready");
  });
  it("allows microphone recordings without AI and protects signed audio access", async () => {
    const created = await call("/api/attempts", "POST", {
      taskId: "sp1-001",
      mode: "practice",
    });
    const id = created.data.id;
    const wav = new WavCodec().encode(new Float32Array(16000));
    const ticket = await call("/api/audio/upload-ticket", "POST", {
      attemptId: id,
      questionIndex: 0,
      bytes: wav.byteLength,
    });
    expect(ticket.status).toBe(200);
    const uploaded = await clients[0].storage
      .from("speaking")
      .uploadToSignedUrl(ticket.data.path, ticket.data.token, wav, {
        contentType: "audio/wav",
      });
    expect(uploaded.error).toBeNull();
    expect(
      (await call(`/api/audio/${ticket.data.id}/complete`, "POST", {})).status,
    ).toBe(200);
    expect(
      (await call(`/api/audio/${ticket.data.id}`, "GET", undefined, 1)).status,
    ).toBe(404);
    expect((await call(`/api/audio/${ticket.data.id}`)).status).toBe(200);
    await db
      .from("audio_assets")
      .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
      .eq("id", ticket.data.id);
    expect((await call(`/api/audio/${ticket.data.id}`)).status).toBe(410);
    const maintenance = await fetch(`${base}/api/maintenance`, {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    expect(maintenance.ok).toBe(true);
    const expired = await db
      .from("audio_assets")
      .select("state")
      .eq("id", ticket.data.id)
      .single();
    expect(expired.data?.state).toBe("deleted");
    expect(
      (await db.storage.from("speaking").download(ticket.data.path)).error,
    ).not.toBeNull();
  });
  it("keeps quiz submission idempotent and returns corrections", async () => {
    const quiz = await call("/api/vocabulary/quizzes", "POST", {
      topic: "education",
    });
    expect(quiz.status).toBe(200);
    expect(quiz.data.questions).toHaveLength(10);
    expect(quiz.data.answer_key).toBeUndefined();
    const result = await call(
      `/api/vocabulary/quizzes/${quiz.data.id}/submit`,
      "POST",
      { answers: {} },
    );
    expect(result.status).toBe(200);
    expect(result.data).toHaveLength(10);
    expect(
      result.data.every(
        (r: { correct: boolean; expected: string }) =>
          !r.correct && !!r.expected,
      ),
    ).toBe(true);
    await call(`/api/vocabulary/quizzes/${quiz.data.id}/submit`, "POST", {
      answers: {},
    });
    const rows = await db
      .from("vocabulary_results")
      .select("id", { count: "exact" })
      .eq("session_id", quiz.data.id);
    expect(rows.count).toBe(10);
  });
  it("binds an invitation to its verified email and permits only one acceptance", async () => {
    const token = randomUUID() + randomUUID();
    const user = await db.auth.admin.getUserById(userIds[1]);
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const { data } = await db
      .from("invitations")
      .insert({ email: user.data.user!.email, token_hash: tokenHash })
      .select("id")
      .single();
    expect(
      (await call("/api/invitations/accept", "POST", { token })).status,
    ).toBe(403);
    expect(
      (await call("/api/invitations/accept", "POST", { token }, 1)).status,
    ).toBe(200);
    expect(
      (await call("/api/invitations/accept", "POST", { token }, 1)).status,
    ).toBe(200);
    await db.from("invitations").delete().eq("id", data!.id);
  });
});
