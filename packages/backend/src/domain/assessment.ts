import type { AssessmentStatus } from "./attempt";

export type Feedback = {
  category:
    | "reading"
    | "grammar"
    | "vocabulary"
    | "coherence"
    | "task_response"
    | "task_achievement"
    | "data_accuracy"
    | "fluency"
    | "pronunciation";
  subcategory: string;
  issue: string;
  correction: string;
  anchor:
    | { type: "text"; quote: string }
    | { type: "requirement"; requirement: string }
    | {
        type: "audio";
        audioId: string;
        startSeconds: number;
        endSeconds: number;
        quote: string;
      }
    | { type: "question"; number: number; quote: string };
};

export type Transcript = {
  audioId: string;
  text: string;
  segments: { startSeconds: number; endSeconds: number; text: string }[];
};

export type Grade = {
  sufficientEvidence: boolean;
  insufficientReason: string | null;
  criteria: {
    key: string;
    label: string;
    score: number;
    explanation: string;
  }[];
  errors: Feedback[];
  strengths: string[];
  nextFocus: string;
  fulfilledRequirements: {
    requirement: string;
    fulfilled: boolean;
    explanation: string;
  }[];
};

export interface ReadingVerdict {
  number: number;
  statement: string;
  given: string[];
  expected: string[];
  correct: boolean;
  earned: number;
  possible: number;
  paragraph: string;
  evidence: string;
  explanation: string;
}

export interface Assessment {
  id: string;
  attemptId: string;
  userId: string;
  status: AssessmentStatus;
  band: number | null;
  grade: Grade | null;
  reading: ReadingVerdict[] | null;
  transcripts: Transcript[];
  model: string | null;
  rubricVersion: string;
  errorCode: string | null;
  createdAt: string;
  completedAt: string | null;
}

export class BandCalculator {
  calculate(scores: number[]): number | null {
    if (
      scores.length !== 4 ||
      scores.some((score) => !Number.isFinite(score) || score < 1 || score > 9)
    )
      return null;
    return (
      Math.round(
        (scores.reduce((sum, score) => sum + score, 0) / scores.length) * 2,
      ) / 2
    );
  }
}
