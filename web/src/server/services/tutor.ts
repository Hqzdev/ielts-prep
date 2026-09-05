import "server-only";
import { randomUUID } from "node:crypto";
import { adminClient } from "../supabase";
import { config } from "../config";
import { databaseError } from "../repositories/mapping";
import { PracticeRepository } from "../repositories/practice";
import { LearningService } from "./learning";
import { GeminiProvider } from "./gemini";
import type { Profile } from "@/domain/profile";
import { AppError } from "@/domain/errors";
import { personalityFor, type PreppyPersonality } from "@/domain/preppy";
import { PreppyReplyDecoder } from "@/domain/preppy-reply";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: string;
}
export class TutorService {
  constructor(
    private readonly db = adminClient(),
    private readonly injectedProvider?: Pick<
      GeminiProvider,
      "stream" | "greet"
    >,
  ) {}
  async threads(userId: string) {
    const { data, error } = await this.db
      .from("chat_threads")
      .select("id,title,attempt_id,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    databaseError(error);
    return data ?? [];
  }
  async messages(userId: string, threadId: string): Promise<ChatMessage[]> {
    await this.thread(userId, threadId);
    const { data, error } = await this.db
      .from("chat_messages")
      .select("id,role,content,status")
      .eq("user_id", userId)
      .eq("thread_id", threadId)
      .order("created_at")
      .limit(300);
    databaseError(error);
    return (data ?? []) as ChatMessage[];
  }
  async respond(
    profile: Profile,
    input: {
      content?: string;
      threadId?: string;
      attemptId?: string;
      retryAssistantId?: string;
      personality?: PreppyPersonality;
      explicit?: boolean;
    },
  ): Promise<Response> {
    const preferences = {
      personality: input.personality ?? ("classic" as const),
      explicit: input.explicit ?? false,
    };
    if (!config.geminiKey && !this.injectedProvider)
      throw new AppError(
        "AI_UNAVAILABLE",
        "Your AI tutor is not connected yet. Other exercises are available.",
        503,
      );
    const repository = new PracticeRepository();
    let threadId = input.threadId;
    let attemptId = input.attemptId;
    if (threadId) {
      const thread = await this.thread(profile.id, threadId);
      attemptId = thread.attempt_id ?? undefined;
    }
    const attempt = attemptId
      ? await repository.get(profile.id, attemptId)
      : null;
    const assessment = attempt
      ? await repository.assessment(profile.id, attempt.id)
      : null;
    const statistics = await new LearningService().statistics(profile.id);
    if (!threadId) {
      const { data, error } = await this.db
        .from("chat_threads")
        .insert({
          user_id: profile.id,
          title:
            input.content?.slice(0, 75) ??
            `Vey AI · ${personalityFor(preferences.personality).label}`,
          attempt_id: attemptId ?? null,
        })
        .select("id")
        .single();
      databaseError(error);
      threadId = data!.id;
    }
    const previous = await this.messages(profile.id, threadId!);
    const userId = randomUUID();
    const assistantId = input.retryAssistantId ?? randomUUID();
    const retry = input.retryAssistantId
      ? previous.find(
          (message) =>
            message.id === input.retryAssistantId &&
            message.role === "assistant",
        )
      : undefined;
    if (input.retryAssistantId && (!retry || retry.status !== "failed"))
      throw new AppError(
        "INVALID_RETRY",
        "Only an interrupted Vey reply can be retried",
        409,
      );
    const usage = await this.db.rpc("reserve_usage", {
      p_user: profile.id,
      p_kind: "chat",
      p_limit: config.dailyChatLimit,
      p_reference: randomUUID(),
    });
    databaseError(usage.error);
    if (!retry)
      databaseError(
        (
          await this.db.from("chat_messages").insert([
            ...(input.content
              ? [
                  {
                    id: userId,
                    user_id: profile.id,
                    thread_id: threadId,
                    role: "user",
                    content: input.content,
                  },
                ]
              : []),
            {
              id: assistantId,
              user_id: profile.id,
              thread_id: threadId,
              role: "assistant",
              content: "",
              status: "streaming",
            },
          ])
        ).error,
      );
    if (retry) {
      const claimed = await this.db
        .from("chat_messages")
        .update({ status: "streaming" })
        .eq("id", assistantId)
        .eq("user_id", profile.id)
        .eq("status", "failed")
        .select("id")
        .maybeSingle();
      databaseError(claimed.error);
      if (!claimed.data)
        throw new AppError(
          "RETRY_IN_PROGRESS",
          "This reply is already being retried",
          409,
        );
    }
    const provider =
      this.injectedProvider ??
      new GeminiProvider({
        key: config.geminiKey,
        textModel: config.textModel,
        audioModel: config.audioModel,
        ttsModel: config.ttsModel,
        voice: config.voice,
      });
    const encoder = new TextEncoder();
    const db = this.db;
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let content = "";
        let status = "complete";
        let connected = true;
        const emit = (event: unknown) => {
          if (connected)
            try {
              controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
            } catch {
              connected = false;
            }
        };
        emit({ type: "thread", threadId, assistantId });
        const decoder = new PreppyReplyDecoder((expression, position) =>
          emit({ type: "expression", expression, position }),
        );
        try {
          const history = previous.filter((m) => m.status === "complete");
          const response =
            !input.content && !history.some((m) => m.role === "user")
              ? await provider.greet(preferences)
              : await provider.stream(
                  [
                    ...history
                      .slice(-20)
                      .map(({ role, content }) => ({ role, content })),
                    ...(input.content
                      ? [{ role: "user" as const, content: input.content }]
                      : []),
                  ],
                  {
                    goal: profile.targetBand,
                    schedule: {
                      minutes: profile.dailyMinutes,
                      days: profile.studyDays,
                    },
                    weaknesses: statistics.skills.map((s) => ({
                      skill: s.skill,
                      count: s.count,
                      criteria: s.criteria,
                      errors: s.errors,
                    })),
                    selectedAttempt: attempt
                      ? {
                          task: attempt.taskSnapshot,
                          answer: attempt.answer.text,
                          assessment,
                        }
                      : null,
                  },
                  preferences,
                );
          for await (const chunk of response) {
            const text = decoder.push(chunk.text ?? "");
            content += text;
            if (text) emit({ type: "token", text });
          }
          const finalText = decoder.finish();
          content += finalText;
          if (finalText) emit({ type: "token", text: finalText });
          if (!content.trim()) throw new Error("EMPTY_RESPONSE");
        } catch {
          status = "failed";
          emit({
            type: "error",
            message:
              "The response was interrupted. Try sending your message again.",
          });
        } finally {
          if (
            status === "failed" &&
            retry &&
            content.length < retry.content.length
          )
            content = retry.content;
          const saved = await db
            .from("chat_messages")
            .update({ content, status })
            .eq("id", assistantId);
          if (saved.error)
            emit({
              type: "error",
              message: "Could not save the response to your history",
            });
          emit({ type: "done", status: saved.error ? "failed" : status });
          if (connected) controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  }
  private async thread(userId: string, id: string) {
    const { data, error } = await this.db
      .from("chat_threads")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    databaseError(error);
    if (!data) throw new AppError("NOT_FOUND", "Conversation not found", 404);
    return data;
  }
}
