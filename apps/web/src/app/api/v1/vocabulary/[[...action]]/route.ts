import {
  wordSuggestionSchema,
  saveWordSchema,
  createVocabularyQuizSchema,
  submitVocabularyQuizSchema,
} from "@veylo/contracts/schemas/requests";
import { z } from "zod";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { backend } from "@/server/backend";
import { wordInputSchema } from "@veylo/contracts/schemas/vocabulary";
import { AppError } from "@veylo/backend/domain/errors";

type Context = { params: Promise<{ action?: string[] }> };
export async function GET(_: Request, { params }: Context) {
  return handle(_, async () => {
    const profile = await requireProfile();
    const { action } = await params;
    const service = backend().vocabulary;
    return action?.[0] === "quizzes"
      ? service.quiz(profile.id, z.uuid().parse(action[1]))
      : service.words(profile.id);
  });
}
export async function POST(request: Request, { params }: Context) {
  return handle(request, async () => {
    const profile = await requireProfile();
    const { action } = await params;
    const service = backend().vocabulary;
    if (action?.[0] === "suggest") {
      const body = await readBody(request, wordSuggestionSchema);
      return backend().wordAssistance.suggest(
        profile.id,
        body.term,
        body.topic,
      );
    }
    if (action?.[0] === "words")
      return service.add(profile.id, await readBody(request, wordInputSchema));
    if (action?.[0] === "saved") {
      const body = await readBody(request, saveWordSchema);
      return service.save(profile.id, body.wordId, body.saved);
    }
    if (action?.[0] === "quizzes" && !action[1]) {
      const body = await readBody(request, createVocabularyQuizSchema);
      return service.createQuiz(profile.id, body.topic, body.personal);
    }
    if (action?.[0] === "quizzes" && action[2] === "submit") {
      const body = await readBody(request, submitVocabularyQuizSchema);
      return service.submit(
        profile.id,
        z.uuid().parse(action[1]),
        body.answers,
      );
    }
    throw new AppError("NOT_FOUND", "Action not found", "not_found");
  });
}
