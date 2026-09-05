import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AudioBucket,
  AudioStorage,
  RecordingAsset,
  RecordingStore,
  SpeechAssetStore,
} from "../../application/ports/audio";
import { AppError } from "../../domain/errors";
import { databaseError, camelRow } from "./mapping";

export class SupabaseAudioStorage implements AudioStorage {
  constructor(private readonly db: SupabaseClient) {}

  async download(bucket: AudioBucket, path: string) {
    const { data, error } = await this.db.storage.from(bucket).download(path);
    databaseError(error);
    if (!data)
      throw new AppError(
        "AUDIO_UNAVAILABLE",
        "Recording not found",
        "not_found",
      );
    return new Uint8Array(await data.arrayBuffer());
  }

  async upload(bucket: AudioBucket, path: string, bytes: Uint8Array) {
    databaseError(
      (
        await this.db.storage
          .from(bucket)
          .upload(path, bytes, { contentType: "audio/wav", upsert: true })
      ).error,
    );
  }

  async uploadTicket(bucket: AudioBucket, path: string) {
    const { data, error } = await this.db.storage
      .from(bucket)
      .createSignedUploadUrl(path);
    databaseError(error);
    return data!.token;
  }

  async signedUrl(bucket: AudioBucket, path: string, seconds: number) {
    const { data, error } = await this.db.storage
      .from(bucket)
      .createSignedUrl(path, seconds);
    databaseError(error);
    return data!.signedUrl;
  }

  async remove(bucket: AudioBucket, path: string) {
    databaseError((await this.db.storage.from(bucket).remove([path])).error);
  }
}

export class SupabaseSpeechAssetStore implements SpeechAssetStore {
  constructor(private readonly db: SupabaseClient) {}

  async cached(key: string) {
    const { data, error } = await this.db
      .from("speech_assets")
      .select("path")
      .eq("cache_key", key)
      .maybeSingle();
    databaseError(error);
    return (data?.path as string | null) ?? null;
  }

  async save(key: string, path: string, model: string) {
    databaseError(
      (
        await this.db
          .from("speech_assets")
          .upsert({ cache_key: key, path, model })
      ).error,
    );
  }
}

export class SupabaseRecordingStore implements RecordingStore {
  constructor(private readonly db: SupabaseClient) {}

  async list(userId: string, now: Date) {
    const { data, error } = await this.db
      .from("audio_assets")
      .select("id,duration,expires_at")
      .eq("user_id", userId)
      .eq("state", "ready")
      .gt("expires_at", now.toISOString())
      .order("created_at", { ascending: false });
    databaseError(error);
    return (data ?? []).map((row) => ({
      id: row.id as string,
      duration: row.duration as number,
      expiresAt: row.expires_at as string,
    }));
  }

  async count(attemptId: string) {
    const { count, error } = await this.db
      .from("audio_assets")
      .select("id", { count: "exact", head: true })
      .eq("attempt_id", attemptId)
      .neq("state", "deleted");
    databaseError(error);
    return count ?? 0;
  }

  async create(
    asset: Omit<RecordingAsset, "duration" | "state" | "expiresAt">,
  ) {
    databaseError(
      (
        await this.db.from("audio_assets").insert({
          id: asset.id,
          user_id: asset.userId,
          attempt_id: asset.attemptId,
          question_index: asset.questionIndex,
          path: asset.path,
          bytes: asset.bytes,
        })
      ).error,
    );
  }

  async asset(userId: string, id: string) {
    const { data, error } = await this.db
      .from("audio_assets")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    databaseError(error);
    if (!data)
      throw new AppError("NOT_FOUND", "Recording not found", "not_found");
    return camelRow(data) as unknown as RecordingAsset;
  }

  async ready(userId: string, id: string, duration: number) {
    databaseError(
      (
        await this.db
          .from("audio_assets")
          .update({ state: "ready", duration })
          .eq("id", id)
          .eq("user_id", userId)
      ).error,
    );
  }

  async remove(userId: string, id: string) {
    databaseError(
      (
        await this.db
          .from("audio_assets")
          .update({ state: "deleted" })
          .eq("id", id)
          .eq("user_id", userId)
      ).error,
    );
  }
}
