import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { sessionClient } from "./supabase";
import { config } from "./config";
import { AppError } from "@/domain/errors";
import type { Profile } from "@/domain/profile";

export const currentProfile = cache(async (): Promise<Profile | null> => {
  if (!config.databaseReady) return null;
  const client = await sessionClient();
  const { data: auth, error } = await client.auth.getUser();
  if (error || !auth.user) return null;
  const { data } = await client
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .single();
  if (!data) return null;
  return {
    id: data.id,
    email: auth.user.email ?? "",
    name: data.name,
    role: data.role,
    betaAccess: data.beta_access,
    onboarded: data.onboarded,
    targetBand: data.target_band,
    selfReportedBand: data.self_reported_band,
    examDate: data.exam_date,
    dailyMinutes: data.daily_minutes,
    studyDays: data.study_days,
    timezone: data.timezone,
  };
});

export async function requireProfile(): Promise<Profile> {
  const profile = await currentProfile();
  if (!profile) throw new AppError("UNAUTHENTICATED", "Please sign in", 401);
  if (!profile.betaAccess)
    throw new AppError(
      "INVITATION_REQUIRED",
      "You need an invitation to access the app",
      403,
    );
  return profile;
}

export async function pageProfile(): Promise<Profile> {
  if (!config.databaseReady) redirect("/setup");
  const profile = await currentProfile();
  if (!profile) redirect("/login");
  if (!profile.betaAccess) redirect("/access");
  if (!profile.onboarded) redirect("/onboarding");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin")
    throw new AppError(
      "FORBIDDEN",
      "You don't have permission to do this",
      403,
    );
  return profile;
}
