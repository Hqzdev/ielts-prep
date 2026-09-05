import { z } from "zod";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { profileInputSchema } from "@/domain/profile";
import { adminClient, sessionClient } from "@/server/supabase";
import { databaseError } from "@/server/repositories/mapping";
export async function PATCH(request: Request) {
  return handle(async () => {
    const profile = await requireProfile();
    const data = await readBody(request, profileInputSchema);
    databaseError(
      (
        await adminClient()
          .from("profiles")
          .update({
            name: data.name,
            target_band: data.targetBand,
            self_reported_band: data.selfReportedBand,
            exam_date: data.examDate,
            daily_minutes: data.dailyMinutes,
            study_days: [...new Set(data.studyDays)],
            timezone: data.timezone,
            onboarded: true,
          })
          .eq("id", profile.id)
      ).error,
    );
    return { saved: true };
  });
}
export async function DELETE(request: Request) {
  return handle(async () => {
    const profile = await requireProfile();
    await readBody(request, z.object({ confirmation: z.literal("DELETE") }));
    const db = adminClient();
    const { data } = await db
      .from("audio_assets")
      .select("path")
      .eq("user_id", profile.id);
    if (data?.length)
      databaseError(
        (await db.storage.from("speaking").remove(data.map((a) => a.path)))
          .error,
      );
    databaseError((await db.auth.admin.deleteUser(profile.id)).error);
    await (await sessionClient()).auth.signOut();
    return { deleted: true };
  });
}
