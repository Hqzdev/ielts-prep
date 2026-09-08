import "server-only";
import { createNativeBackend } from "@veylo/backend/composition/native";
import { config } from "./config";

export function nativeBackend() {
  return createNativeBackend(config);
}
export type NativeBackend = ReturnType<typeof nativeBackend>;
