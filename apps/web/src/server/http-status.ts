import type { FailureKind } from "@veylo/backend/domain/errors";

export const failureStatus: Record<FailureKind, number> = {
  invalid: 400,
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  expired: 410,
  too_large: 413,
  unsupported: 415,
  limited: 429,
  internal: 500,
  upstream: 502,
  unavailable: 503,
};
