import { createVeyloClient } from "@veylo/api-client";
import { notifyLearningActivity } from "./learning-activity";

export { ApiError, apiData } from "@veylo/api-client";

export const api = createVeyloClient({
  baseUrl:
    typeof window === "undefined"
      ? "http://localhost:3000/api/v1"
      : new URL("/api/v1", window.location.href).href,
  fetch: (request) => globalThis.fetch(request),
  onSuccess(path, method) {
    if (
      method === "POST" &&
      [
        "/attempts/{id}/submit",
        "/vocabulary/quizzes/{id}/submit",
        "/arcade-rounds/{id}",
      ].includes(path)
    )
      notifyLearningActivity();
  },
});
