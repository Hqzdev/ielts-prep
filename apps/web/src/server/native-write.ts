import { z } from "zod";
import * as requestSchemas from "@veylo/contracts/schemas/requests";
import * as native from "@veylo/contracts/schemas/native";
import { profileInputSchema } from "@veylo/contracts/schemas/profile";
import { wordInputSchema } from "@veylo/contracts/schemas/vocabulary";
import type { Profile } from "@veylo/backend/domain/profile";
import { AppError } from "@veylo/backend/domain/errors";
import type { NativeBackend } from "./native";
import { readBody } from "./http";

export class NativeCommandController {
  constructor(private readonly backend: NativeBackend) {}
  async handle(
    profile: Profile,
    path: string[],
    request: Request,
  ): Promise<unknown> {
    const [resource, rawId, action, tail] = path;
    const common = this.backend.common;
    const method = request.method;
    if (resource === "onboarding" && path.length === 1 && method === "PATCH")
      return this.backend.learning.saveOnboarding(
        profile,
        await readBody(request, native.saveNativeOnboardingSchema),
      );
    if (resource === "preferences" && path.length === 1 && method === "PATCH") {
      await this.backend.store.preferences(
        profile.id,
        await readBody(request, native.nativePreferencesSchema),
      );
      return { saved: true };
    }
    if (resource === "events" && path.length === 1 && method === "POST") {
      await this.backend.store.event(
        profile.id,
        await readBody(request, native.nativeEventSchema),
      );
      return { saved: true };
    }
    if (resource === "profile" && path.length === 1) {
      if (method === "PATCH")
        return common.identity.save(
          profile.id,
          await readBody(request, profileInputSchema),
        );
      if (method === "DELETE") {
        await readBody(request, requestSchemas.deleteAccountSchema);
        return common.identity.deleteAccount(profile.id);
      }
    }
    if (resource === "attempts" && !rawId && method === "POST") {
      const body = await readBody(request, requestSchemas.createAttemptSchema);
      return this.backend.practice.create(profile.id, body.taskId, body.mode);
    }
    if (resource === "attempts" && rawId && path.length <= 3) {
      const id = z.uuid().parse(rawId);
      const attempt = await this.backend.practice.owned(profile.id, id);
      if (action === "notes" && method === "PATCH")
        return this.backend.practice.saveNotes(
          profile.id,
          id,
          await readBody(request, native.nativeAttemptNotesSchema),
        );
      if (!action && method === "PATCH") {
        const body = await readBody(request, requestSchemas.saveAttemptSchema);
        return common.practice.save(
          profile.id,
          id,
          body.revision,
          body.answer,
          body.action,
        );
      }
      if (action === "hints" && method === "POST") {
        const body = await readBody(request, native.nativeHintSchema);
        return this.backend.tutor.respond(profile, {
          attemptId: id,
          content:
            body.content +
            (body.questionNumber ? "\nQuestion " + body.questionNumber : ""),
          personality: "classic",
          explicit: false,
        });
      }
      if (method === "POST") {
        await readBody(request, requestSchemas.emptyRequestSchema);
        if (action === "submit") return common.practice.submit(profile.id, id);
        if (action === "retry-assessment")
          return common.practice.retry(profile.id, id);
        if (action === "revisions")
          return this.backend.practice.create(
            profile.id,
            attempt.taskId,
            "practice",
            id,
          );
      }
    }
    if (
      resource === "chat" &&
      rawId === "messages" &&
      path.length === 2 &&
      method === "POST"
    )
      return this.backend.tutor.respond(
        profile,
        await readBody(request, requestSchemas.chatRequestSchema),
      );
    if (
      resource === "chat" &&
      rawId === "feedback" &&
      path.length === 2 &&
      method === "POST"
    ) {
      const body = await readBody(
        request,
        requestSchemas.chatFeedbackRequestSchema,
      );
      return this.backend.feedback.analyse(profile.id, body.threadId);
    }
    if (resource === "word-sprints" && method === "POST") {
      if (!rawId) {
        const body = await readBody(request, z.object({ id: z.uuid() }));
        return this.backend.sprint.start(profile.id, body.id);
      }
      if (path.length === 2) {
        const body = await readBody(request, native.sprintAnswerSchema);
        return this.backend.sprint.answer(
          profile.id,
          z.uuid().parse(rawId),
          body.questionId,
          body.answer,
        );
      }
    }
    if (resource === "vocabulary" && method === "POST") {
      if (rawId === "suggest" && !action) {
        const body = await readBody(
          request,
          requestSchemas.wordSuggestionSchema,
        );
        return this.backend.wordAssistance.suggest(
          profile.id,
          body.term,
          body.topic,
        );
      }
      if (rawId === "words" && !action)
        return common.vocabulary.add(
          profile.id,
          await readBody(request, wordInputSchema),
        );
      if (rawId === "saved" && !action) {
        const body = await readBody(request, requestSchemas.saveWordSchema);
        return common.vocabulary.save(profile.id, body.wordId, body.saved);
      }
      if (rawId === "quizzes" && !action) {
        const body = await readBody(
          request,
          requestSchemas.createVocabularyQuizSchema,
        );
        return common.vocabulary.createQuiz(
          profile.id,
          body.topic,
          body.personal,
        );
      }
      if (
        rawId === "quizzes" &&
        action &&
        tail === "submit" &&
        path.length === 4
      ) {
        const body = await readBody(
          request,
          requestSchemas.submitVocabularyQuizSchema,
        );
        return common.vocabulary.submit(
          profile.id,
          z.uuid().parse(action),
          body.answers,
        );
      }
    }
    if (resource === "audio" && this.backend.practice.canRecord(profile.id)) {
      if (rawId === "upload-ticket" && path.length === 2 && method === "POST") {
        const body = await readBody(request, requestSchemas.uploadTicketSchema);
        await this.backend.practice.owned(profile.id, body.attemptId);
        return common.audio.ticket(
          profile.id,
          body.attemptId,
          body.questionIndex,
          body.bytes,
        );
      }
      if (
        rawId &&
        action === "complete" &&
        path.length === 3 &&
        method === "POST"
      ) {
        await readBody(request, requestSchemas.emptyRequestSchema);
        return common.audio.complete(profile.id, z.uuid().parse(rawId));
      }
      if (rawId && path.length === 2 && method === "DELETE") {
        await readBody(request, requestSchemas.emptyRequestSchema);
        return common.audio.remove(profile.id, z.uuid().parse(rawId));
      }
    }
    throw new AppError("NOT_FOUND", "Endpoint not found", "not_found");
  }
}
