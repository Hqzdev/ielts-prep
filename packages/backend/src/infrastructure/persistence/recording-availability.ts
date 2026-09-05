import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecordingAvailability } from "../../application/ports/practice";
import { databaseError } from "./mapping";

export class SupabaseRecordingAvailability implements RecordingAvailability {
  constructor(private readonly db: SupabaseClient) {}

  async ready(userId: string, attemptId: string, ids: string[], now: Date) {
    const { data, error } = await this.db
      .from("audio_assets")
      .select("id,question_index")
      .eq("user_id", userId)
      .eq("attempt_id", attemptId)
      .eq("state", "ready")
      .in("id", ids)
      .gt("expires_at", now.toISOString());
    databaseError(error);
    return (data ?? []).map((row) => ({
      id: row.id as string,
      questionIndex: row.question_index as number,
    }));
  }
}
