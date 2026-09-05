export type AudioBucket = "speaking" | "examiner";

export interface AudioStorage {
  download(bucket: AudioBucket, path: string): Promise<Uint8Array>;
  upload(bucket: AudioBucket, path: string, bytes: Uint8Array): Promise<void>;
  uploadTicket(bucket: AudioBucket, path: string): Promise<string>;
  signedUrl(
    bucket: AudioBucket,
    path: string,
    seconds: number,
  ): Promise<string>;
  remove(bucket: AudioBucket, path: string): Promise<void>;
}

export interface SpeechAssetStore {
  cached(key: string): Promise<string | null>;
  save(key: string, path: string, model: string): Promise<void>;
}

export interface RecordingAsset {
  id: string;
  userId: string;
  attemptId: string;
  questionIndex: number;
  path: string;
  bytes: number;
  duration: number | null;
  state: "pending" | "ready" | "deleted";
  expiresAt: string;
}

export interface RecordingStore {
  list(
    userId: string,
    now: Date,
  ): Promise<{ id: string; duration: number; expiresAt: string }[]>;
  count(attemptId: string): Promise<number>;
  create(
    asset: Omit<RecordingAsset, "duration" | "state" | "expiresAt">,
  ): Promise<void>;
  asset(userId: string, id: string): Promise<RecordingAsset>;
  ready(userId: string, id: string, duration: number): Promise<void>;
  remove(userId: string, id: string): Promise<void>;
}

export interface SpeechSettings {
  readonly ttsModel: string;
  readonly voice: string;
}
