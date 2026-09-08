import { z } from "zod";

export const profileInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  targetBand: z.number().min(1).max(9).multipleOf(0.5),
  selfReportedBand: z
    .number()
    .min(1)
    .max(9)
    .multipleOf(0.5)
    .nullable()
    .default(null),
  examDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .default(null),
  dailyMinutes: z.number().int().min(10).max(180),
  studyDays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  timezone: z.string().refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Unknown time zone"),
});
