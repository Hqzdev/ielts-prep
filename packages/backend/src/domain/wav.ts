export class WavCodec {
  encode(samples: Float32Array, sampleRate = 16000): ArrayBuffer {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const text = (offset: number, value: string) => {
      for (let i = 0; i < value.length; i++)
        view.setUint8(offset + i, value.charCodeAt(i));
    };
    text(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    text(8, "WAVE");
    text(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    text(36, "data");
    view.setUint32(40, samples.length * 2, true);
    samples.forEach((sample, index) =>
      view.setInt16(
        44 + index * 2,
        Math.max(-1, Math.min(1, sample)) * (sample < 0 ? 32768 : 32767),
        true,
      ),
    );
    return buffer;
  }

  inspect(buffer: ArrayBuffer): { duration: number; sampleRate: number } {
    if (buffer.byteLength < 44) throw new Error("INVALID_WAV");
    const view = new DataView(buffer);
    const label = (start: number, length: number) =>
      String.fromCharCode(...new Uint8Array(buffer, start, length));
    if (
      label(0, 4) !== "RIFF" ||
      view.getUint32(4, true) !== buffer.byteLength - 8 ||
      view.getUint32(16, true) !== 16 ||
      view.getUint16(32, true) !== 2 ||
      view.getUint32(28, true) !== view.getUint32(24, true) * 2 ||
      (buffer.byteLength - 44) % 2 !== 0 ||
      label(8, 4) !== "WAVE" ||
      label(12, 4) !== "fmt " ||
      label(36, 4) !== "data" ||
      view.getUint16(20, true) !== 1 ||
      view.getUint16(22, true) !== 1 ||
      view.getUint16(34, true) !== 16 ||
      view.getUint32(40, true) !== buffer.byteLength - 44
    )
      throw new Error("INVALID_WAV");
    const sampleRate = view.getUint32(24, true);
    if (![16000, 24000].includes(sampleRate))
      throw new Error("INVALID_SAMPLE_RATE");
    return {
      sampleRate,
      duration: (buffer.byteLength - 44) / (sampleRate * 2),
    };
  }
}
