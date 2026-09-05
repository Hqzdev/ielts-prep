import "server-only";
import { createBackend } from "@veylo/backend/composition";
import { config } from "./config";

export function backend() {
  return createBackend(config);
}
