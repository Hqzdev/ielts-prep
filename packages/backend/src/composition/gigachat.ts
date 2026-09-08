import { readFileSync } from "node:fs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { GigaChatSource } from "../infrastructure/ai/gigachat";
import {
  GigaHttpsTransport,
  GigaLease,
} from "../infrastructure/ai/gigachat-transport";

export interface NativeAiSettings {
  readonly gigachatCredentials?: string;
  readonly gigachatScope?: string;
  readonly gigachatCertificatePath?: string;
  readonly nativeTextModel?: string;
  readonly nativeWritingModel?: string;
  readonly nativeWritingEnabled?: boolean;
  readonly nativeRecordingTesters?: string[];
}

export function createNativeAi(settings: NativeAiSettings, db: SupabaseClient) {
  const certificate = () =>
    settings.gigachatCertificatePath
      ? readFileSync(settings.gigachatCertificatePath, "utf8")
      : undefined;
  return new GigaChatSource(
    Boolean(settings.gigachatCredentials),
    new GigaHttpsTransport(
      settings.gigachatCredentials ?? "",
      settings.gigachatScope ?? "GIGACHAT_API_PERS",
      new GigaLease(db),
      certificate,
    ),
    settings.nativeTextModel ?? "GigaChat-2-Pro",
  );
}
