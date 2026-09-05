export type ProfileInput = {
  name: string;
  targetBand: number;
  selfReportedBand: number | null;
  examDate: string | null;
  dailyMinutes: number;
  studyDays: number[];
  timezone: string;
};

export interface Profile extends ProfileInput {
  id: string;
  email: string;
  role: "student" | "admin";
  betaAccess: boolean;
  onboarded: boolean;
}
