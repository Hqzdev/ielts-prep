import { profileSchema } from "@veylo/contracts/schemas/responses";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

config({ path: new URL("../.env.local", import.meta.url), quiet: true });
const base = process.env.NATIVE_API_BASE ?? "http://127.0.0.1:3000";
let db: SupabaseClient;
let userId: string;
let token: string;
let auth: SupabaseClient;
let refreshToken: string;

beforeAll(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url))
    throw new Error("Native API tests require local Supabase");
  db = createClient(url, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });
  const email = `native-${randomUUID()}@ielts.local`;
  const password = randomUUID() + "Aa1!";
  const created = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error) throw created.error;
  userId = created.data.user.id;
  await db
    .from("profiles")
    .update({ beta_access: true, onboarded: true })
    .eq("id", userId);
  auth = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  });
  const signedIn = await auth.auth.signInWithPassword({ email, password });
  if (signedIn.error) throw signedIn.error;
  token = signedIn.data.session.access_token;
  refreshToken = signedIn.data.session.refresh_token;
});

afterAll(async () => {
  if (userId) await db.auth.admin.deleteUser(userId);
});

function call(path: string, authorization: string) {
  return fetch(base + path, { headers: { Authorization: authorization } });
}

describe("native Bearer authorization", () => {
  it("verifies an access token without requiring browser cookies", async () => {
    const response = await call("/api/v1/tasks", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect((await response.json()).items.length).toBeGreaterThan(0);
  });
  it("returns study preferences through the API without direct table access", async () => {
    const response = await call("/api/v1/profile", `Bearer ${token}`);
    expect(response.status).toBe(200);
    const profile = profileSchema.parse(await response.json());
    expect(profile.id).toBe(userId);
    expect(profile.betaAccess).toBe(true);
  });
  it("rejects malformed and invalid credentials instead of falling back to another identity", async () => {
    expect((await call("/api/v1/tasks", "Bearer invalid")).status).toBe(401);
    expect((await call("/api/v1/tasks", "Basic invalid")).status).toBe(401);
  });
  it("rechecks revoked membership with a still valid access token", async () => {
    await db.from("profiles").update({ beta_access: false }).eq("id", userId);
    try {
      expect((await call("/api/v1/tasks", `Bearer ${token}`)).status).toBe(403);
    } finally {
      await db.from("profiles").update({ beta_access: true }).eq("id", userId);
    }
  });
  it("does not elevate a learner to an administrator", async () => {
    const response = await fetch(base + "/api/v1/admin/publish", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: "irrelevant", published: false }),
    });
    expect(response.status).toBe(403);
  });
  it("accepts a refreshed session and invalidates refresh credentials on logout", async () => {
    const refreshed = await auth.auth.refreshSession({
      refresh_token: refreshToken,
    });
    expect(refreshed.error).toBeNull();
    expect(refreshed.data.session).not.toBeNull();
    expect(
      (
        await call(
          "/api/v1/tasks",
          "Bearer " + refreshed.data.session!.access_token,
        )
      ).status,
    ).toBe(200);
    const revokedRefreshToken = refreshed.data.session!.refresh_token;
    expect((await auth.auth.signOut()).error).toBeNull();
    expect(
      (await auth.auth.refreshSession({ refresh_token: revokedRefreshToken }))
        .error,
    ).not.toBeNull();
  });
});
