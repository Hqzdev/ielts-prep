import { AppError } from "./errors";

export type NativeSkill = "reading" | "writing";
export type StartingLevel =
  "below_5_5" | "5_5_6_0" | "6_5_7_0" | "7_5_plus" | "unknown";
export type StudyBarrier =
  "time" | "direction" | "anxiety" | "previous_attempt" | "other" | "private";

export interface NativeAnswers {
  startingLevel: StartingLevel | null;
  targetBand: number | null;
  examStatus: "unanswered" | "not_booked" | "scheduled";
  examDate: string | null;
  focus: NativeSkill[];
  barrier: StudyBarrier | null;
}

export interface NativePreferences {
  dailyReminder: boolean;
  reminderHour: number;
  soundEffects: boolean;
}

export interface NativeOnboarding {
  revision: number;
  version: number;
  step: number;
  completedAt: string | null;
  answers: NativeAnswers;
  preferences: NativePreferences;
}

export class NativeOnboardingRules {
  validStep(step: number, answers: NativeAnswers, today: string): boolean {
    switch (step) {
      case 0:
        return answers.startingLevel !== null;
      case 1:
        return (
          answers.targetBand !== null &&
          [6.5, 7, 7.5, 8].includes(answers.targetBand)
        );
      case 2:
        return answers.examStatus === "not_booked"
          ? answers.examDate === null
          : answers.examStatus === "scheduled" &&
              answers.examDate !== null &&
              answers.examDate >= today;
      case 3:
        return (
          answers.focus.length >= 1 &&
          answers.focus.length <= 2 &&
          new Set(answers.focus).size === answers.focus.length &&
          answers.focus.every((skill) => ["reading", "writing"].includes(skill))
        );
      case 4:
        return answers.barrier !== null;
      default:
        return false;
    }
  }

  validateCompletion(answers: NativeAnswers, today: string) {
    if (![0, 1, 2, 3, 4].every((step) => this.validStep(step, answers, today)))
      throw new AppError(
        "ONBOARDING_INCOMPLETE",
        "Complete each question before continuing",
      );
  }

  resumeStep(answers: NativeAnswers, today: string) {
    return (
      [0, 1, 2, 3, 4].find((step) => !this.validStep(step, answers, today)) ?? 5
    );
  }
}
