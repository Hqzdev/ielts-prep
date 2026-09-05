export type FailureKind =
  | "invalid"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "expired"
  | "too_large"
  | "unsupported"
  | "limited"
  | "internal"
  | "upstream"
  | "unavailable";

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly kind: FailureKind = "invalid",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Could not complete this action";
}
