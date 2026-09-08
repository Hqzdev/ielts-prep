export interface Clock {
  now(): Date;
}

export interface IdentifierSource {
  create(): string;
}

export interface RandomSource {
  integer(upperBound: number): number;
}

export interface AssessmentPolicy {
  canAssessAttempt?(attempt: import("../../domain/attempt").Attempt): boolean;
  readonly dailyAssessmentLimit: number;
  canAssess(skill: "writing" | "speaking"): boolean;
}

export interface ContentEncoding {
  fingerprint(value: string): string;
  base64(bytes: Uint8Array): string;
}
