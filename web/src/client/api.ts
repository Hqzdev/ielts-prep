import { AppError } from "@/domain/errors";
import { notifyLearningActivity } from "./learning-activity";

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const result = await response.json();
  if (!response.ok)
    throw new AppError(
      result.error?.code ?? "REQUEST_FAILED",
      result.error?.message ?? "Could not complete this action",
      response.status,
    );
  if (
    options?.method === "POST" &&
    /^\/api\/(attempts\/[^/]+\/submit|vocabulary\/quizzes\/[^/]+\/submit|arcade-rounds\/[^/]+)$/.test(
      path,
    )
  )
    notifyLearningActivity();
  return result as T;
}
