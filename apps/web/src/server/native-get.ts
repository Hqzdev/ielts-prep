import { z } from "zod";
import type { Profile } from "@veylo/backend/domain/profile";
import { AppError } from "@veylo/backend/domain/errors";
import type { NativeBackend } from "./native";

export class NativeQueryController {
  constructor(private readonly backend: NativeBackend) {}
  async handle(profile: Profile, path: string[], url: URL): Promise<unknown> {
    const [resource, rawId, action, tail] = path;
    const common = this.backend.common;
    if (resource === "bootstrap" && path.length === 1)
      return {
        profile,
        onboarding: await this.backend.store.onboarding(profile.id),
        capabilities: this.backend.capabilities(profile.id),
      };
    if (resource === "onboarding" && path.length === 1)
      return this.backend.store.onboarding(profile.id);
    if (resource === "profile" && path.length === 1) return profile;
    if (resource === "dashboard" && path.length === 1)
      return this.backend.learning.dashboard(profile);
    if (resource === "statistics" && path.length === 1)
      return this.backend.learning.progress(
        profile,
        url.searchParams.has("days")
          ? z.coerce
              .number()
              .int()
              .min(1)
              .max(3650)
              .parse(url.searchParams.get("days"))
          : undefined,
      );
    if (resource === "tasks" && !rawId) {
      const query = Object.fromEntries(url.searchParams);
      const page = z.coerce
        .number()
        .int()
        .min(1)
        .max(10000)
        .parse(query.page ?? 1);
      if (
        query.skill === "speaking" &&
        this.backend.practice.canRecord(profile.id)
      )
        return common.catalog.search(profile.id, { ...query, page });
      return this.backend.catalog.search(profile.id, { ...query, page });
    }
    if (resource === "tasks" && rawId && path.length === 2) {
      const task = await common.catalog.task(rawId);
      if (
        task.skill === "speaking" &&
        !this.backend.practice.canRecord(profile.id)
      )
        throw new AppError(
          "SKILL_UNAVAILABLE",
          "This skill is hidden",
          "forbidden",
        );
      return task;
    }
    if (resource === "attempts" && rawId && path.length <= 3) {
      const id = z.uuid().parse(rawId);
      if (action === "notes")
        return this.backend.practice.notes(profile.id, id);
      if (!action || action === "result") {
        const result = await this.backend.practice.result(profile.id, id);
        if (
          result.attempt.taskSnapshot.skill === "speaking" &&
          ["submitted", "completed"].includes(result.attempt.status)
        ) {
          const available = new Set(
            (await common.audio.list(profile.id)).map((asset) => asset.id),
          );
          result.attempt.answer.audioIds =
            result.attempt.answer.audioIds.filter((audioId) =>
              available.has(audioId),
            );
        }
        return result;
      }
    }
    if (resource === "vocabulary" && path.length === 1)
      return common.vocabulary.words(profile.id);
    if (
      resource === "vocabulary" &&
      rawId === "quizzes" &&
      action &&
      path.length === 3
    )
      return common.vocabulary.quiz(profile.id, z.uuid().parse(action));
    if (resource === "chat" && rawId === "threads") {
      if (!action) return this.backend.conversations.threads(profile.id);
      if (tail === "messages" && path.length === 4)
        return this.backend.conversations.messages(
          profile.id,
          z.uuid().parse(action),
        );
    }
    if (resource === "word-sprints" && rawId && path.length === 2)
      return this.backend.sprint.get(profile.id, z.uuid().parse(rawId));
    if (
      resource === "audio" &&
      rawId &&
      path.length === 2 &&
      this.backend.practice.canRecord(profile.id)
    )
      return common.audio.playback(profile.id, z.uuid().parse(rawId));
    throw new AppError("NOT_FOUND", "Endpoint not found", "not_found");
  }
}
