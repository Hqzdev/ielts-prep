import { z } from "zod";
import { handle, readBody } from "@/server/http";
import { requireProfile } from "@/server/identity";
import { VocabularyService } from "@/server/services/vocabulary";
import { wordInputSchema } from "@/domain/vocabulary";
import { AppError } from "@/domain/errors";
import { WordAssistance } from "@/server/services/word-assistance";
type Context = { params: Promise<{ action?: string[] }> };
export async function GET(_: Request, { params }: Context) {
  return handle(async () => {
    const profile = await requireProfile();
    const { action } = await params;
    const service = new VocabularyService();
    return action?.[0] === "quizzes"
      ? service.quiz(profile.id, z.uuid().parse(action[1]))
      : service.words(profile.id);
  });
}
export async function POST(request: Request, { params }: Context) {
  return handle(async () => {
    const profile = await requireProfile();
    const { action } = await params;
    const service = new VocabularyService();
    if (action?.[0] === "suggest") {
      const body = await readBody(
        request,
        z.object({
          term: z.string().trim().min(1).max(100),
          topic: z.string().trim().min(1).max(60),
        }),
      );
      return new WordAssistance().suggest(profile.id, body.term, body.topic);
    }
    if (action?.[0] === "words")
      return service.add(profile.id, await readBody(request, wordInputSchema));
    if (action?.[0] === "saved") {
      const body = await readBody(
        request,
        z.object({ wordId: z.string().max(150), saved: z.boolean() }),
      );
      return service.save(profile.id, body.wordId, body.saved);
    }
    if (action?.[0] === "quizzes" && !action[1]) {
      const body = await readBody(
        request,
        z.object({
          topic: z.string().max(60).optional(),
          personal: z.boolean().optional(),
        }),
      );
      return service.createQuiz(profile.id, body.topic, body.personal);
    }
    if (action?.[0] === "quizzes" && action[2] === "submit") {
      const body = await readBody(
        request,
        z.object({ answers: z.record(z.string(), z.string().max(500)) }),
      );
      return service.submit(
        profile.id,
        z.uuid().parse(action[1]),
        body.answers,
      );
    }
    throw new AppError("NOT_FOUND", "Action not found", 404);
  });
}
