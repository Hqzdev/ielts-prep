import { it, expect } from "vitest";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

config({ path: new URL("../.env.local", import.meta.url), quiet: true });

it("handles ten concurrent learners saving and queueing one assessment each", async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url))
    throw new Error("Load checks require local Supabase");
  const db = createClient(url, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });
  const learners: { id: string; cookie: string }[] = [];
  const base = "http://127.0.0.1:3000";
  try {
    for (let index = 0; index < 10; index++) {
      const email = `load-${randomUUID()}@ielts.local`;
      const password = randomUUID() + "Aa1!";
      const created = await db.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (created.error) throw created.error;
      const id = created.data.user.id;
      const learner = { id, cookie: "" };
      learners.push(learner);
      await db
        .from("profiles")
        .update({ beta_access: true, onboarded: true })
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
      learner.cookie = [...jar]
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");
    }
    const timings = await Promise.all(
      learners.map(async (learner) => {
        const start = performance.now();
        const headers = {
          Cookie: learner.cookie,
          Origin: base,
          "Content-Type": "application/json",
        };
        const create = await fetch(`${base}/api/attempts`, {
          method: "POST",
          headers,
          body: JSON.stringify({ taskId: "w2-002", mode: "practice" }),
        });
        expect(create.ok).toBe(true);
        const attempt = await create.json();
        const saved = await fetch(`${base}/api/attempts/${attempt.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            revision: attempt.revision,
            answer: {
              text: "Cities should provide reliable public transport and affordable housing.",
              reading: {},
              audioIds: [],
            },
          }),
        });
        expect(saved.ok).toBe(true);
        const submitted = await db.rpc("submit_attempt", {
          p_user: learner.id,
          p_id: attempt.id,
          p_available: true,
          p_daily_limit: 5,
        });
        expect(submitted.error).toBeNull();
        const duplicate = await db.rpc("submit_attempt", {
          p_user: learner.id,
          p_id: attempt.id,
          p_available: true,
          p_daily_limit: 5,
        });
        expect(duplicate.data.id).toBe(submitted.data.id);
        return performance.now() - start;
      }),
    );
    const jobs = await db
      .from("assessments")
      .select("id,assessment_jobs(id)")
      .in(
        "user_id",
        learners.map((l) => l.id),
      );
    expect(jobs.data).toHaveLength(10);
    expect(jobs.data?.every((job) => !!job.assessment_jobs)).toBe(true);
    const ordered = timings.toSorted((a, b) => a - b);
    await mkdir(".local", { recursive: true });
    await writeFile(
      ".local/load-report.json",
      JSON.stringify(
        {
          users: 10,
          failures: 0,
          generatedAt: new Date().toISOString(),
          environment: "local-next-development",
          minMs: ordered[0],
          p95Ms: ordered[9],
          meanMs: timings.reduce((sum, value) => sum + value, 0) / 10,
          aiCalls: 0,
        },
        null,
        2,
      ),
    );
  } finally {
    for (const learner of learners) await db.auth.admin.deleteUser(learner.id);
  }
}, 120000);
