import { z } from "zod";

export const skillSchema = z.enum(["writing", "speaking", "reading"]);

export const optionSchema = z.object({ value: z.string(), label: z.string() });

export const readingQuestionSchema = z.object({
  number: z.number().int().positive(),
  statement: z.string().min(1),
  mode: z.enum(["single", "multiple", "text"]),
  options: z.array(optionSchema).default([]),
  selectCount: z.number().int().positive().default(1),
  maxWords: z.number().int().positive().optional(),
  allowNumber: z.boolean().default(false),
  group: z.string().optional(),
  label: z.string().optional(),
});

export const paragraphSchema = z.object({
  label: z.string(),
  text: z.string(),
});

const visualSchema = z.object({
  chartType: z.enum([
    "bar_chart",
    "line_graph",
    "pie_chart",
    "table",
    "process_diagram",
  ]),
  title: z.string(),
  unit: z.string().optional(),
  periods: z.array(z.string()).default([]),
  dataSeries: z
    .array(
      z.object({
        category: z.string(),
        values: z.record(z.string(), z.number()),
      }),
    )
    .default([]),
  processKind: z.enum(["linear", "cyclical"]).optional(),
  processSteps: z.array(z.string()).default([]),
});

export const taskSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive().default(1),
  title: z.string().min(1),
  skill: skillSchema,
  part: z.number().int().min(1).max(3),
  topic: z.string(),
  format: z.string(),
  durationSeconds: z.number().int().positive(),
  minimumWords: z.number().int().nonnegative().default(0),
  prompt: z.string(),
  instructions: z.string(),
  createdAt: z.string(),
  source: z.string().default("authored_practice"),
  passageId: z.string().optional(),
  paragraphs: z.array(paragraphSchema).default([]),
  readingQuestions: z.array(readingQuestionSchema).default([]),
  readingLayout: z
    .enum(["list", "summary", "notes", "table", "flowchart", "diagram"])
    .default("list"),
  reuseAllowed: z.boolean().default(true),
  diagram: z
    .object({
      title: z.string(),
      nodes: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          x: z.number(),
          y: z.number(),
          questionNumber: z.number().optional(),
        }),
      ),
      edges: z.array(z.object({ source: z.string(), target: z.string() })),
    })
    .optional(),
  visual: visualSchema.optional(),
  speakingQuestions: z.array(z.string()).default([]),
  cuePoints: z.array(z.string()).default([]),
  preparationSeconds: z.number().int().nonnegative().default(0),
  relatedTaskId: z.string().optional(),
});

export const readingKeySchema = z.object({
  number: z.number().int().positive(),
  answers: z.array(z.string()).min(1),
  paragraph: z.string(),
  evidence: z.string().min(1),
  explanation: z.string().min(1),
  alternatives: z.array(z.string()).default([]),
});

export const contentEntrySchema = z.object({
  task: taskSchema,
  readingKey: z.array(readingKeySchema).default([]),
});
