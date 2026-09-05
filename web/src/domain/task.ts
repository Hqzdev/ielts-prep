import { z } from "zod";

export const skillSchema = z.enum(["writing", "speaking", "reading"]);
export type Skill = z.infer<typeof skillSchema>;

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
export type ReadingQuestion = z.infer<typeof readingQuestionSchema>;

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
export type TaskVisual = z.infer<typeof visualSchema>;

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
export type Task = z.infer<typeof taskSchema>;

export const readingKeySchema = z.object({
  number: z.number().int().positive(),
  answers: z.array(z.string()).min(1),
  paragraph: z.string(),
  evidence: z.string().min(1),
  explanation: z.string().min(1),
  alternatives: z.array(z.string()).default([]),
});
export type ReadingKey = z.infer<typeof readingKeySchema>;
export const contentEntrySchema = z.object({
  task: taskSchema,
  readingKey: z.array(readingKeySchema).default([]),
});
export type ContentEntry = z.infer<typeof contentEntrySchema>;

export const topicLabels: Record<string, string> = {
  education: "Education",
  technology: "Technology",
  environment: "Environment",
  health: "Health",
  government: "Government",
  crime: "Crime and law",
  work: "Work",
  society: "Society",
  globalization: "Globalisation",
  transport: "Transport",
  housing: "Housing",
  media: "Media",
  culture: "Culture",
  tourism: "Travel",
  science: "Science",
  person: "People",
  place: "Places",
  object: "Objects",
  event: "Events",
  experience: "Experiences",
  activity: "Activities",
  everyday: "Everyday life",
};

export const formatLabels: Record<string, string> = {
  opinion: "Opinion",
  discussion: "Discussion",
  advantages_disadvantages: "Advantages / Disadvantages",
  outweigh: "Outweigh",
  causes_solutions: "Causes / Solutions",
  problem_solution: "Problem / Solution",
  two_part: "Two-part question",
  positive_negative: "Positive / Negative",
  bar_chart: "Bar chart",
  line_graph: "Line graph",
  pie_chart: "Pie chart",
  table: "Table",
  process_diagram: "Process diagram",
  true_false_not_given: "True / False / Not Given",
  yes_no_not_given: "Yes / No / Not Given",
  multiple_choice: "Multiple choice",
  matching_information: "Matching information",
  matching_headings: "Matching headings",
  matching_features: "Matching features",
  matching_sentence_endings: "Matching sentence endings",
  sentence_completion: "Sentence completion",
  summary_completion: "Summary completion",
  note_completion: "Note completion",
  table_completion: "Table completion",
  flow_chart_completion: "Flow-chart completion",
  diagram_label_completion: "Diagram labels",
  short_answer: "Short answers",
  speaking_part1: "Part 1",
  speaking_part2: "Part 2",
  speaking_part3: "Part 3",
};

export function taskPartLabel(task: Pick<Task, "skill" | "part">): string {
  return task.skill === "reading"
    ? "Reading"
    : `${task.skill === "writing" ? "Task" : "Part"} ${task.part}`;
}
