import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ChatMessage,
  ChatThread,
  ConversationStore,
  UsageQuota,
} from "../../application/ports/conversations";
import { AppError } from "../../domain/errors";
import { databaseError, camelRow } from "./mapping";

export class SupabaseConversationStore implements ConversationStore {
  constructor(private readonly db: SupabaseClient) {}

  async threads(userId: string) {
    const { data, error } = await this.db
      .from("chat_threads")
      .select("id,title,attempt_id,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    databaseError(error);
    return (data ?? []).map((row) => camelRow(row) as unknown as ChatThread);
  }

  async thread(userId: string, id: string) {
    const { data, error } = await this.db
      .from("chat_threads")
      .select("id,title,attempt_id,created_at")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    databaseError(error);
    if (!data)
      throw new AppError("NOT_FOUND", "Conversation not found", "not_found");
    return camelRow(data) as unknown as ChatThread;
  }

  async createThread(userId: string, title: string, attemptId?: string) {
    const { data, error } = await this.db
      .from("chat_threads")
      .insert({ user_id: userId, title, attempt_id: attemptId ?? null })
      .select("id")
      .single();
    databaseError(error);
    return data!.id as string;
  }

  async messages(userId: string, threadId: string) {
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

  async createMessages(
    userId: string,
    threadId: string,
    userMessageId: string,
    assistantId: string,
    content?: string,
  ) {
    databaseError(
      (
        await this.db.from("chat_messages").insert([
          ...(content
            ? [
                {
                  id: userMessageId,
                  user_id: userId,
                  thread_id: threadId,
                  role: "user",
                  content,
                },
              ]
            : []),
          {
            id: assistantId,
            user_id: userId,
            thread_id: threadId,
            role: "assistant",
            content: "",
            status: "streaming",
          },
        ])
      ).error,
    );
  }

  async claimRetry(userId: string, assistantId: string) {
    const { data, error } = await this.db
      .from("chat_messages")
      .update({ status: "streaming" })
      .eq("id", assistantId)
      .eq("user_id", userId)
      .eq("status", "failed")
      .select("id")
      .maybeSingle();
    databaseError(error);
    return !!data;
  }

  async saveReply(
    userId: string,
    assistantId: string,
    content: string,
    status: string,
  ) {
    databaseError(
      (
        await this.db
          .from("chat_messages")
          .update({ content, status })
          .eq("id", assistantId)
          .eq("user_id", userId)
      ).error,
    );
  }
}

export class SupabaseUsageQuota implements UsageQuota {
  constructor(private readonly db: SupabaseClient) {}

  async reserve(
    userId: string,
    kind: "chat" | "chat_feedback" | "chat_transcription",
    limit: number,
    reference: string,
  ) {
    databaseError(
      (
        await this.db.rpc("reserve_usage", {
          p_user: userId,
          p_kind: kind,
          p_limit: limit,
          p_reference: reference,
        })
      ).error,
    );
  }
}
