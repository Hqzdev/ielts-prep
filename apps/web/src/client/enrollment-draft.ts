import { z } from "zod";

const draftSchema = z.object({
  name: z.string().max(80).default(""),
  reason: z.string().default(""),
  experience: z.string().default(""),
  targetBand: z.number().min(1).max(9).default(7),
  weakness: z.string().default(""),
  examWindow: z.string().default("No Date Yet"),
  dailyMinutes: z.number().min(10).max(180).default(30),
  concern: z.string().default(""),
});
export type EnrollmentAnswers = z.infer<typeof draftSchema>;

export class EnrollmentDraft {
  private readonly key = "ielts-orbit-enrollment";
  constructor(
    private readonly storage: Pick<
      Storage,
      "getItem" | "setItem" | "removeItem"
    >,
  ) {}
  exists() {
    return this.storage.getItem(this.key) !== null;
  }
  static decode(serialized: string): EnrollmentAnswers {
    try {
      const data = draftSchema.safeParse(JSON.parse(serialized));
      return data.success ? data.data : draftSchema.parse({});
    } catch {
      return draftSchema.parse({});
    }
  }
  read(): EnrollmentAnswers {
    return EnrollmentDraft.decode(this.storage.getItem(this.key) ?? "{}");
  }
  save(answers: EnrollmentAnswers) {
    this.storage.setItem(this.key, JSON.stringify(draftSchema.parse(answers)));
  }
  clear() {
    this.storage.removeItem(this.key);
  }
}
