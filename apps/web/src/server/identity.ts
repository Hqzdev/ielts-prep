import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sessionClient } from "./supabase";
import { backend } from "./backend";
import { config } from "./config";
import { AccessPolicy } from "@veylo/backend/domain/access-policy";
import type { Profile } from "@veylo/backend/domain/profile";

export const currentProfile = cache(async (): Promise<Profile | null> => {
  if (!config.databaseReady) return null;
  const authorization = (await headers()).get("authorization");
  if (authorization !== null) {
    const match = /^Bearer ([^\s]+)$/i.exec(authorization);
    return match ? backend().identity.bearer(match[1]) : null;
  }
  const client = await sessionClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return backend().identity.profile({
    id: data.user.id,
    email: data.user.email ?? "",
  });
});

export async function requireProfile(): Promise<Profile> {
  return new AccessPolicy().require(await currentProfile());
}

export async function requireAdmin(): Promise<Profile> {
  return new AccessPolicy().admin(await currentProfile());
}

export async function pageProfile(): Promise<Profile> {
  if (!config.databaseReady) redirect("/setup");
  const profile = await currentProfile();
  if (!profile) redirect("/login");
  if (!profile.betaAccess) redirect("/access");
  if (!profile.onboarded) redirect("/onboarding");
  return profile;
}
