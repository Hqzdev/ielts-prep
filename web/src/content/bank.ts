import writing1 from "./bank/writing_task1_academic.json";
import writing2 from "./bank/writing_task2.json";
import reading from "./bank/reading_passage.json";
import speaking1 from "./bank/speaking_part1.json";
import speaking2 from "./bank/speaking_part2.json";
import speaking3 from "./bank/speaking_part3.json";
import { contentEntrySchema, type ContentEntry } from "@/domain/task";
import { readingExplanations } from "./reading-explanations";
import { extendedReading } from "./extended-reading";

const essayTitles = [
  "Information literacy at school",
  "New homes: city or countryside?",
  "A four-day working week",
  "Returning drink containers",
  "Neighbours and local communities",
  "Digital access to essential services",
  "Learning traditional practical skills",
  "Reclaiming city parking spaces",
  "Residents and natural attractions",
  "Funding scientific research",
  "Choosing a university subject",
  "Citizen reporting in local news",
  "Making use of public sports facilities",
  "Being available outside working hours",
  "Skilled workers abroad",
  "Free admission to museums",
  "Maintaining community facilities",
  "Who should organise recycling?",
  "Sharing tools in the community",
  "Sharing a home across generations",
];
const writingTopics = [
  "education",
  "transport",
  "society",
  "culture",
  "environment",
  "work",
  "education",
  "tourism",
  "environment",
  "environment",
  "society",
  "work",
  "science",
  "transport",
  "environment",
  "housing",
  "environment",
  "media",
  "health",
  "culture",
];

const readingTopics = [
  "education",
  "transport",
  "environment",
  "society",
  "environment",
  "culture",
  "environment",
  "transport",
  "housing",
  "culture",
  "environment",
  "culture",
  "education",
  "culture",
  "education",
  "environment",
  "culture",
  "science",
  "science",
  "culture",
];

export function authoredBank(): ContentEntry[] {
  const entries: unknown[] = [];
  for (const [index, source] of writing2.entries())
    entries.push({
      task: {
        id: source.id,
        title: essayTitles[index],
        skill: "writing",
        part: 2,
        topic: source.topic_category,
        format: source.task_type,
        durationSeconds: 2400,
        minimumWords: 250,
        prompt: source.prompt,
        instructions: source.instructions,
        createdAt: "2026-09-03",
      },
    });
  for (const [index, source] of writing1.entries())
    entries.push({
      task: {
        id: source.id,
        title: source.title,
        skill: "writing",
        part: 1,
        topic: writingTopics[index],
        format: source.chart_type,
        durationSeconds: 1200,
        minimumWords: 150,
        prompt: source.prompt,
        instructions: source.instructions,
        createdAt: "2026-09-03",
        visual: {
          chartType: source.chart_type,
          title: source.title,
          unit: "unit" in source ? source.unit : undefined,
          periods: "periods" in source ? source.periods : [],
          dataSeries: "data_series" in source ? source.data_series : [],
          processKind:
            "process_kind" in source ? source.process_kind : undefined,
          processSteps: "process_steps" in source ? source.process_steps : [],
        },
      },
    });
  for (const [index, source] of reading.entries())
    entries.push({
      task: {
        id: source.id,
        title: source.title,
        skill: "reading",
        part: 1,
        topic: readingTopics[index],
        format: "true_false_not_given",
        durationSeconds: 1200,
        prompt: source.title,
        instructions: source.instructions,
        createdAt: "2026-09-03",
        passageId: source.id,
        paragraphs: source.paragraphs,
        readingQuestions: source.questions.map((question) => ({
          ...question,
          mode: "single",
          options: ["TRUE", "FALSE", "NOT GIVEN"].map((value) => ({
            value,
            label: value,
          })),
        })),
      },
      readingKey: source.answer_key.map((key, index) => ({
        number: key.number,
        answers: [key.answer],
        paragraph: key.paragraph,
        evidence: key.evidence,
        explanation: readingExplanations[source.id][index],
      })),
    });
  for (const source of speaking1)
    entries.push({
      task: {
        id: source.id,
        title: source.topic,
        skill: "speaking",
        part: 1,
        topic: "everyday",
        format: "speaking_part1",
        durationSeconds: 240,
        prompt: source.topic,
        instructions: "Answer the examiner's questions about familiar topics.",
        createdAt: "2026-09-03",
        speakingQuestions: source.questions,
      },
    });
  for (const source of speaking2)
    entries.push({
      task: {
        id: source.id,
        title: source.topic,
        skill: "speaking",
        part: 2,
        topic: source.topic_category,
        format: "speaking_part2",
        durationSeconds: 240,
        prompt: source.opening,
        instructions:
          "You have one minute to prepare. Speak for one to two minutes.",
        createdAt: "2026-09-03",
        speakingQuestions: [source.opening, ...source.rounding_off_questions],
        cuePoints: [...source.bullet_points, source.explanation],
        preparationSeconds: 60,
        relatedTaskId: source.id.replace("sp2", "sp3"),
      },
    });
  for (const source of speaking3)
    entries.push({
      task: {
        id: source.id,
        title: source.related_topic,
        skill: "speaking",
        part: 3,
        topic: "society",
        format: "speaking_part3",
        durationSeconds: 300,
        prompt: source.related_topic,
        instructions:
          "Discuss the following questions in more detail. Explain and support your ideas.",
        createdAt: "2026-09-03",
        speakingQuestions: source.questions,
        relatedTaskId: source.part2_id,
      },
    });
  return [...entries, ...extendedReading()].map((entry) =>
    contentEntrySchema.parse(entry),
  );
}
