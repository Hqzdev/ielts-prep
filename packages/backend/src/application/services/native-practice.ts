import { AppError } from "../../domain/errors";
import type { AttemptMode } from "../../domain/attempt";
import type { Profile } from "../../domain/profile";
import type { NativeStore, AttemptNotes } from "../ports/native";
import type { PracticeStore, CatalogStore } from "../ports/practice";
import type { PracticeService } from "./practice";
import type { TutorService } from "./tutor";
import type { ConversationInput } from "../ports/conversations";

export class NativePracticeService {
  constructor(
    private readonly store: NativeStore,
    private readonly attempts: PracticeStore,
    private readonly catalog: CatalogStore,
    private readonly practice: PracticeService,
    private readonly model: string,
    private readonly recordingTesters: string[],
  ) {}
  canRecord(userId: string) {
    return this.recordingTesters.includes(userId);
  }
  async create(
    userId: string,
    taskId: string,
    mode: AttemptMode,
    parentId?: string,
  ) {
    const task = await this.catalog.task(taskId);
    this.requireSkill(userId, task.skill);
    if (parentId) {
      const parent = await this.owned(userId, parentId);
      if (parent.taskId !== taskId)
        throw new AppError(
          "INVALID_REVISION",
          "The revision must use the original task",
        );
    }
    return this.store.createAttempt(userId, taskId, mode, this.model, parentId);
  }
  async owned(userId: string, id: string) {
    const attempt = await this.attempts.get(userId, id);
    this.requireSkill(userId, attempt.taskSnapshot.skill);
    return attempt;
  }
  async result(userId: string, id: string) {
    await this.owned(userId, id);
    return this.practice.result(userId, id);
  }
  async notes(userId: string, id: string) {
    await this.owned(userId, id);
    return this.store.notes(userId, id);
  }
  async saveNotes(userId: string, id: string, notes: AttemptNotes) {
    const attempt = await this.owned(userId, id);
    const text = attempt.taskSnapshot.paragraphs
      .map((paragraph) => paragraph.text)
      .join("\n");
    if (notes.highlights.some((quote) => !quote || !text.includes(quote)))
      throw new AppError(
        "INVALID_HIGHLIGHT",
        "Highlight text from this passage",
      );
    if (
      notes.flaggedQuestions.some(
        (number) =>
          !attempt.taskSnapshot.readingQuestions.some(
            (question) => question.number === number,
          ),
      )
    )
      throw new AppError("INVALID_QUESTION", "Question not found");
    return this.store.saveNotes(userId, id, notes);
  }
  private requireSkill(userId: string, skill: string) {
    if (
      !["reading", "writing"].includes(skill) &&
      !(skill === "speaking" && this.canRecord(userId))
    )
      throw new AppError(
        "SKILL_UNAVAILABLE",
        "This skill is not available yet",
        "forbidden",
      );
  }
}

export class NativeTutorService {
  constructor(
    private readonly tutor: TutorService,
    private readonly attempts: PracticeStore,
  ) {}
  async respond(profile: Profile, input: ConversationInput) {
    let attemptId = input.attemptId;
    if (input.threadId) {
      const threads = await this.tutor.threads(profile.id);
      const thread = threads.find((thread) => thread.id === input.threadId);
      if (!thread)
        throw new AppError("NOT_FOUND", "Conversation not found", "not_found");
      attemptId = thread.attemptId ?? undefined;
    }
    if (attemptId) {
      const attempt = await this.attempts.get(profile.id, attemptId);
      if (!["reading", "writing"].includes(attempt.taskSnapshot.skill))
        throw new AppError("SKILL_UNAVAILABLE", "Choose Reading or Writing");
      if (
        attempt.mode === "strict" &&
        ["in_progress", "paused"].includes(attempt.status)
      )
        throw new AppError(
          "HINTS_LOCKED",
          "Submit this exam before asking for help",
          "conflict",
        );
    }
    return this.tutor.respond(profile, input);
  }
}
