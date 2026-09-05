export type Skill = "writing" | "speaking" | "reading";

export type ReadingQuestion = {
  number: number;
  statement: string;
  mode: "single" | "multiple" | "text";
  options: { value: string; label: string }[];
  selectCount: number;
  allowNumber: boolean;
  maxWords?: number | undefined;
  group?: string | undefined;
  label?: string | undefined;
};

export type TaskVisual = {
  chartType:
    "bar_chart" | "line_graph" | "pie_chart" | "table" | "process_diagram";
  title: string;
  periods: string[];
  dataSeries: { category: string; values: Record<string, number> }[];
  processSteps: string[];
  unit?: string | undefined;
  processKind?: "linear" | "cyclical" | undefined;
};

export type Task = {
  id: string;
  version: number;
  title: string;
  skill: Skill;
  part: number;
  topic: string;
  format: string;
  durationSeconds: number;
  minimumWords: number;
  prompt: string;
  instructions: string;
  createdAt: string;
  source: string;
  paragraphs: { label: string; text: string }[];
  readingQuestions: ReadingQuestion[];
  readingLayout:
    "table" | "list" | "summary" | "notes" | "flowchart" | "diagram";
  reuseAllowed: boolean;
  speakingQuestions: string[];
  cuePoints: string[];
  preparationSeconds: number;
  passageId?: string | undefined;
  diagram?:
    | {
        title: string;
        nodes: {
          id: string;
          label: string;
          x: number;
          y: number;
          questionNumber?: number | undefined;
        }[];
        edges: { source: string; target: string }[];
      }
    | undefined;
  visual?: TaskVisual | undefined;
  relatedTaskId?: string | undefined;
};

export type ReadingKey = {
  number: number;
  answers: string[];
  paragraph: string;
  evidence: string;
  explanation: string;
  alternatives: string[];
};

export type ContentEntry = {
  task: Task;
  readingKey: ReadingKey[];
};
