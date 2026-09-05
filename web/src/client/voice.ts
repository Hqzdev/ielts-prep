import type { MicVAD } from "@ricky0123/vad-web";
import { WavCodec } from "@/domain/wav";
import { AppError } from "@/domain/errors";
import { api } from "./api";
import { browserClient } from "./supabase";
import { DraftStore } from "./draft-store";

export class VoiceActivity {
  private detector: MicVAD | null = null;
  constructor(private readonly onSpeech: (active: boolean) => void) {}
  async prepare() {
    const { MicVAD } = await import("@ricky0123/vad-web");
    this.detector = await MicVAD.new({
      model: "v5",
      baseAssetPath: "/vad/",
      onnxWASMBasePath: "/vad/",
      startOnLoad: false,
      positiveSpeechThreshold: 0.6,
      negativeSpeechThreshold: 0.4,
      redemptionMs: 300,
      minSpeechMs: 160,
      onFrameProcessed: (probabilities) =>
        this.onSpeech(probabilities.isSpeech > 0.6),
    });
  }
  async start() {
    if (!this.detector) await this.prepare();
    await this.detector!.start();
  }
  async pause() {
    await this.detector?.pause();
    this.onSpeech(false);
  }
  async destroy() {
    await this.detector?.destroy();
    this.detector = null;
  }
}

export class VoiceRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  async prepare() {
    if (!navigator.mediaDevices?.getUserMedia)
      throw new AppError(
        "MICROPHONE_UNAVAILABLE",
        "Recording requires a browser with microphone access over HTTPS",
      );
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
      video: false,
    });
  }
  start() {
    if (!this.stream)
      throw new AppError(
        "MICROPHONE_UNAVAILABLE",
        "Allow microphone access first",
      );
    if (this.recorder?.state === "recording")
      throw new AppError(
        "RECORDING_ACTIVE",
        "Recording is already in progress",
      );
    this.chunks = [];
    const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(
      (type) => MediaRecorder.isTypeSupported(type),
    );
    this.recorder = new MediaRecorder(
      this.stream,
      mimeType ? { mimeType } : undefined,
    );
    this.recorder.ondataavailable = (event) => {
      if (event.data.size) this.chunks.push(event.data);
    };
    this.recorder.start(1000);
  }
  async stop(): Promise<Blob> {
    const recorder = this.recorder;
    if (!recorder || recorder.state !== "recording")
      throw new AppError("NO_RECORDING", "No recording is in progress");
    await new Promise<void>((resolve, reject) => {
      recorder.onstop = () => resolve();
      recorder.onerror = () =>
        reject(new AppError("RECORDING_FAILED", "Recording was interrupted"));
      recorder.stop();
    });
    const encoded = new Blob(this.chunks, { type: recorder.mimeType });
    const context = new AudioContext();
    try {
      const decoded = await context.decodeAudioData(
        await encoded.arrayBuffer(),
      );
      const offline = new OfflineAudioContext(
        1,
        Math.ceil(decoded.duration * 16000),
        16000,
      );
      const source = offline.createBufferSource();
      source.buffer = decoded;
      source.connect(offline.destination);
      source.start();
      const rendered = await offline.startRendering();
      return new Blob([new WavCodec().encode(rendered.getChannelData(0))], {
        type: "audio/wav",
      });
    } finally {
      await context.close();
    }
  }
  pause() {
    if (this.recorder?.state === "recording") this.recorder.pause();
  }
  resume() {
    if (this.recorder?.state === "paused") this.recorder.resume();
  }
  destroy() {
    if (this.recorder && this.recorder.state !== "inactive")
      this.recorder.stop();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }
}

export class AudioUploader {
  constructor(private readonly store = new DraftStore()) {}
  async upload(
    userId: string,
    attemptId: string,
    questionIndex: number,
    blob: Blob,
  ): Promise<{ id: string; duration: number }> {
    const key = `${userId}:${attemptId}:${questionIndex}`;
    await this.store.saveRecording(key, blob);
    const ticket = await api<{ id: string; path: string; token: string }>(
      "/api/audio/upload-ticket",
      {
        method: "POST",
        body: JSON.stringify({ attemptId, questionIndex, bytes: blob.size }),
      },
    );
    const { error } = await browserClient()
      .storage.from("speaking")
      .uploadToSignedUrl(ticket.path, ticket.token, blob, {
        contentType: "audio/wav",
      });
    if (error) throw error;
    const result = await api<{ id: string; duration: number }>(
      `/api/audio/${ticket.id}/complete`,
      { method: "POST", body: "{}" },
    );
    await this.store.removeRecording(key);
    return result;
  }
}
