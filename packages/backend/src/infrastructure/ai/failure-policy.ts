import type { ProviderFailurePolicy } from "../../application/ports/assessment";
import { AppError } from "../../domain/errors";

export class GeminiFailurePolicy implements ProviderFailurePolicy {
  classify(error: unknown) {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? Number(error.status)
        : 0;
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "PROVIDER_ERROR";
    const permanent =
      [400, 401, 403, 404, 422].includes(status) ||
      code.startsWith("INVALID_AI") ||
      error instanceof SyntaxError ||
      (error instanceof AppError &&
        ["invalid", "unauthenticated", "forbidden", "not_found"].includes(
          error.kind,
        ));
    return { code, retryable: !permanent };
  }
}
