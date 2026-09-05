import { AppError } from "@veylo/backend/domain/errors";
import { config } from "./config";

export async function readAudio(request: Request): Promise<Uint8Array> {
  const origin = request.headers.get("origin");
  if (
    origin &&
    origin !== new URL(request.url).origin &&
    origin !== new URL(config.appUrl).origin
  )
    throw new AppError("INVALID_ORIGIN", "Invalid request origin", "forbidden");
  if (request.headers.get("content-type")?.split(";")[0] !== "audio/wav")
    throw new AppError(
      "INVALID_AUDIO",
      "Use mono WAV audio at 16 kHz",
      "unsupported",
    );
  const maxBytes = 44 + 16000 * 2 * 60;
  if (Number(request.headers.get("content-length")) > maxBytes)
    throw new AppError(
      "BODY_TOO_LARGE",
      "A voice answer must be at most 60 seconds",
      "too_large",
    );
  const reader = request.body?.getReader();
  if (!reader) throw new AppError("INVALID_AUDIO", "No recording received");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new AppError(
          "BODY_TOO_LARGE",
          "A voice answer must be at most 60 seconds",
          "too_large",
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const buffer = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return buffer;
}
