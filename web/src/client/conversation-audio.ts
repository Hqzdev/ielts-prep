import type { MicVAD } from "@ricky0123/vad-web";
import { WavCodec } from "@/domain/wav";

export interface ConversationAudio {
  prepare(
    onSpeech: (active: boolean) => void,
    onLevel: (level: number, roundness?: number) => void,
  ): Promise<void>;
  record(): void;
  stopRecording(): Promise<Blob>;
  play(url: string, signal: AbortSignal): Promise<void>;
  mute(muted: boolean): void;
  destroy(): Promise<void>;
}

export class BrowserConversationAudio implements ConversationAudio {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private detector: MicVAD | null = null;
  private worklet: AudioWorkletNode | null = null;
  private player: AudioBufferSourceNode | null = null;
  private samples: Float32Array[] = [];
  private recording = false;
  private sampleCount = 0;
  private alive = false;
  private frame = 0;
  private onLevel: ((level: number, roundness?: number) => void) | null = null;
  async preparePlayback(onLevel: (level: number, roundness?: number) => void) {
    this.alive = true;
    this.onLevel = onLevel;
    this.context ??= new AudioContext();
    await this.context.resume();
  }
  async prepare(
    onSpeech: (active: boolean) => void,
    onLevel: (level: number, roundness?: number) => void,
  ) {
    await this.preparePlayback(onLevel);
    if (!navigator.mediaDevices?.getUserMedia)
      throw new Error(
        "Microphone access requires HTTPS and a supported browser.",
      );
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
      video: false,
    });
    if (!this.alive) {
      stream.getTracks().forEach((track) => track.stop());
      throw new DOMException("Session closed", "AbortError");
    }
    this.stream = stream;
    const context = this.context!;
    await context.audioWorklet.addModule("/preppy-recorder.js");
    if (!this.alive) throw new DOMException("Session closed", "AbortError");
    this.worklet = new AudioWorkletNode(context, "preppy-recorder");
    this.worklet.port.onmessage = (event: MessageEvent<Float32Array>) => {
      if (this.recording && this.sampleCount < context.sampleRate * 60) {
        this.samples.push(event.data);
        this.sampleCount += event.data.length;
      }
    };
    const source = context.createMediaStreamSource(stream);
    source.connect(this.worklet);
    const silent = context.createGain();
    silent.gain.value = 0;
    this.worklet.connect(silent).connect(context.destination);
    const { MicVAD } = await import("@ricky0123/vad-web");
    const detector = await MicVAD.new({
      audioContext: context,
      model: "v5",
      baseAssetPath: "/vad/",
      onnxWASMBasePath: "/vad/",
      startOnLoad: false,
      getStream: async () => stream,
      pauseStream: async () => {},
      resumeStream: async () => stream,
      positiveSpeechThreshold: 0.6,
      negativeSpeechThreshold: 0.4,
      redemptionMs: 1500,
      minSpeechMs: 160,
      onFrameProcessed: (probabilities) =>
        onSpeech(probabilities.isSpeech > 0.6),
    });
    if (!this.alive) {
      await detector.destroy();
      throw new DOMException("Session closed", "AbortError");
    }
    this.detector = detector;
    await detector.start();
  }
  record() {
    this.samples = [];
    this.sampleCount = 0;
    this.recording = true;
  }
  async stopRecording() {
    this.recording = false;
    const rate = this.context?.sampleRate ?? 48000;
    const length = this.samples.reduce((sum, chunk) => sum + chunk.length, 0);
    const input = new Float32Array(length);
    let offset = 0;
    for (const chunk of this.samples) {
      input.set(chunk, offset);
      offset += chunk.length;
    }
    this.samples = [];
    const output = new Float32Array(
      Math.min(960000, Math.floor((length * 16000) / rate)),
    );
    for (let i = 0; i < output.length; i++) {
      const position = (i * rate) / 16000;
      const index = Math.floor(position);
      const fraction = position - index;
      output[i] =
        input[index] * (1 - fraction) +
        (input[Math.min(index + 1, length - 1)] ?? 0) * fraction;
    }
    return new Blob([new WavCodec().encode(output)], { type: "audio/wav" });
  }
  mute(muted: boolean) {
    this.stream?.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
  }
  async play(url: string, signal: AbortSignal) {
    const context = this.context;
    if (!context || !this.alive)
      throw new Error("Audio is disconnected. Reconnect to play the reply.");
    const response = await fetch(url, { signal });
    if (!response.ok)
      throw new Error(
        "The reply audio could not be downloaded. Retry playback.",
      );
    const buffer = await context.decodeAudioData(await response.arrayBuffer());
    signal.throwIfAborted();
    await context.resume();
    const source = context.createBufferSource();
    source.buffer = buffer;
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser).connect(context.destination);
    this.player = source;
    const values = new Float32Array(analyser.fftSize);
    const spectrum = new Uint8Array(analyser.frequencyBinCount);
    const measure = () => {
      analyser.getFloatTimeDomainData(values);
      analyser.getByteFrequencyData(spectrum);
      const rms = Math.sqrt(
        values.reduce((sum, value) => sum + value * value, 0) / values.length,
      );
      const total = spectrum.reduce((sum, value) => sum + value, 0);
      const low = spectrum
        .slice(
          0,
          Math.max(
            1,
            Math.round((900 * analyser.fftSize) / context.sampleRate),
          ),
        )
        .reduce((sum, value) => sum + value, 0);
      this.onLevel?.(
        Math.min(1, rms * 7),
        total ? Math.min(1, (low / total) * 2) : 0,
      );
      this.frame = requestAnimationFrame(measure);
    };
    try {
      await new Promise<void>((resolve, reject) => {
        const abort = () => {
          source.stop();
          reject(new DOMException("Playback stopped", "AbortError"));
        };
        source.onended = () => {
          signal.removeEventListener("abort", abort);
          resolve();
        };
        signal.addEventListener("abort", abort, { once: true });
        source.start();
        measure();
      });
    } finally {
      cancelAnimationFrame(this.frame);
      source.disconnect();
      analyser.disconnect();
      this.player = null;
      this.onLevel?.(0);
    }
  }
  async destroy() {
    this.alive = false;
    this.recording = false;
    this.samples = [];
    cancelAnimationFrame(this.frame);
    this.player?.stop();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.worklet?.disconnect();
    this.worklet = null;
    const detector = this.detector;
    this.detector = null;
    const context = this.context;
    this.context = null;
    await Promise.allSettled([detector?.destroy(), context?.close()]);
  }
}
