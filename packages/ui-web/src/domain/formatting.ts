import type { Task } from "@veylo/backend/domain/task";

import type { Feedback } from "@veylo/backend/domain/assessment";

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

export const categoryLabels: Record<Feedback["category"], string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  coherence: "Coherence",
  task_response: "Task response",
  task_achievement: "Task achievement",
  data_accuracy: "Data accuracy",
  fluency: "Fluency",
  pronunciation: "Pronunciation",
  reading: "Reading comprehension",
};

export function formatDuration(seconds: number): string {
  const value = Math.max(0, Math.floor(Math.abs(seconds)));
  return `${seconds < 0 ? "+" : ""}${Math.floor(value / 60)
    .toString()
    .padStart(2, "0")}:${(value % 60).toString().padStart(2, "0")}`;
}
