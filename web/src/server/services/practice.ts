import "server-only";
import { AttemptClock, type Answer } from "@/domain/attempt";
import { AppError } from "@/domain/errors";
import { ReadingGrader } from "@/domain/reading-grader";
import { PracticeRepository } from "../repositories/practice";
import { CatalogRepository } from "../repositories/catalog";
import { config } from "../config";
import { adminClient } from "../supabase";
import type { Task } from "@/domain/task";

export class PracticeService {
  constructor(
    private readonly attempts = new PracticeRepository(),
    private readonly catalog = new CatalogRepository(),
    private readonly clock = new AttemptClock(),
    private readonly grader = new ReadingGrader(),
  ) {}

  async save(
    userId: string,
    id: string,
    revision: number,
    answer: Answer,
    action?: "pause" | "resume",
  ) {
    const attempt = await this.attempts.get(userId, id);
    if (attempt.taskSnapshot.skill !== "speaking" && answer.audioIds.length)
      throw new AppError(
        "INVALID_AUDIO",
        "Recordings are only available for Speaking",
      );
    if (
      attempt.mode === "strict" &&
      attempt.answer.audioIds.some(
        (audioId, index) => answer.audioIds[index] !== audioId,
      )
    )
      throw new AppError(
        "STRICT_RECORDING",
        "Saved answers cannot be re-recorded in strict mode",
        409,
      );
    this.validateReading(attempt.taskSnapshot, answer);
    await this.validateAudio(userId, id, answer.audioIds);
    return this.attempts.save(userId, id, revision, answer, action);
  }

  async submit(userId: string, id: string) {
    const attempt = await this.attempts.get(userId, id);
    const existing = await this.attempts.assessment(userId, id);
    if (existing && existing.status !== "queued") return existing;
    const skill = attempt.taskSnapshot.skill;
    const empty =
      skill === "writing"
        ? !attempt.answer.text.trim()
        : skill === "speaking"
          ? !attempt.answer.audioIds.length
          : false;
    if (empty && !this.clock.expired(attempt) && !existing)
      throw new AppError(
        "EMPTY_ANSWER",
        skill === "writing"
          ? "Write an answer before submitting"
          : "Record a spoken answer before submitting",
      );
    const assessment =
      existing ??
      (await this.attempts.submit(
        userId,
        id,
        skill !== "reading" && !empty && config.canAssess(skill),
        config.dailyAssessmentLimit,
      ));
    if (skill === "reading" && assessment.status === "queued") {
      const keys = await this.catalog.key(attempt.taskId, attempt.taskVersion);
      return this.attempts.finishReading(
        assessment,
        this.grader.grade(attempt.taskSnapshot, attempt.answer, keys),
      );
    }
    return assessment;
  }

  async retry(userId: string, id: string) {
    const attempt = await this.attempts.get(userId, id);
    if (attempt.taskSnapshot.skill === "reading")
      return this.submit(userId, id);
    if (!config.canAssess(attempt.taskSnapshot.skill))
      throw new AppError(
        "AI_UNAVAILABLE",
        "Assessment will be available once AI is connected and scoring quality has been validated",
        503,
      );
    if (attempt.taskSnapshot.skill === "writing" && !attempt.answer.text.trim())
      throw new AppError("EMPTY_ANSWER", "An empty answer cannot be assessed");
    if (
      attempt.taskSnapshot.skill === "speaking" &&
      !attempt.answer.audioIds.length
    )
      throw new AppError(
        "EMPTY_ANSWER",
        "A recording of your answer is required for assessment",
      );
    await this.validateAudio(userId, id, attempt.answer.audioIds);
    return this.attempts.retry(userId, id, config.dailyAssessmentLimit);
  }

  private validateReading(task: Task, answer: Answer) {
    if (task.skill !== "reading") return;
    const selected: string[] = [];
    for (const [number, value] of Object.entries(answer.reading)) {
      const question = task.readingQuestions.find(
        (q) => q.number === Number(number),
      );
      if (!question)
        throw new AppError("INVALID_QUESTION", "Unknown question number");
      const values = Array.isArray(value) ? value : [value];
      if (
        (question.mode !== "multiple" && values.length > 1) ||
        values.length > question.selectCount
      )
        throw new AppError("INVALID_SELECTION", "Too many options selected");
      if (
        question.mode !== "text" &&
        values.some((v) => v && !question.options.some((o) => o.value === v))
      )
        throw new AppError("INVALID_SELECTION", "Invalid answer option");
      if (!task.reuseAllowed && question.mode !== "text")
        for (const item of values.filter(Boolean)) {
          if (selected.includes(item))
            throw new AppError(
              "REUSED_OPTION",
              "Each option can only be used once",
            );
          selected.push(item);
        }
    }
  }

  private async validateAudio(
    userId: string,
    attemptId: string,
    ids: string[],
  ) {
    if (!ids.length) return;
    const { data, error } = await adminClient()
      .from("audio_assets")
      .select("id,question_index")
      .eq("user_id", userId)
      .eq("attempt_id", attemptId)
      .eq("state", "ready")
      .in("id", ids)
      .gt("expires_at", new Date().toISOString());
    if (
      error ||
      new Set(ids).size !== ids.length ||
      data?.length !== ids.length ||
      ids.some(
        (id, index) =>
          !data?.some(
            (asset) => asset.id === id && asset.question_index === index,
          ),
      )
    )
      throw new AppError(
        "AUDIO_UNAVAILABLE",
        "The recording has not been uploaded or has expired",
      );
  }
}
