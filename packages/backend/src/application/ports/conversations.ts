import type {
  PreppyPersonality,
  PreppyExpression,
  PreppyPosition,
} from "../../domain/preppy";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: string;
}

export interface ChatThread {
  id: string;
  title: string;
  attemptId: string | null;
  createdAt: string;
}

export interface ConversationInput {
  content?: string;
  threadId?: string;
  attemptId?: string;
  retryAssistantId?: string;
  personality?: PreppyPersonality;
  explicit?: boolean;
}

export type ChatEvent =
  | { type: "thread"; threadId: string; assistantId: string }
  | {
      type: "expression";
      expression: PreppyExpression;
      position: PreppyPosition;
    }
  | { type: "token"; text: string }
  | { type: "error"; message: string }
  | { type: "done"; status: string };

export interface ChatReply {
  events: AsyncIterable<ChatEvent>;
}

export interface ConversationStore {
  threads(userId: string): Promise<ChatThread[]>;
  thread(userId: string, id: string): Promise<ChatThread>;
  createThread(
    userId: string,
    title: string,
    attemptId?: string,
  ): Promise<string>;
  messages(userId: string, threadId: string): Promise<ChatMessage[]>;
  createMessages(
    userId: string,
    threadId: string,
    userMessageId: string,
    assistantId: string,
    content?: string,
  ): Promise<void>;
  claimRetry(userId: string, assistantId: string): Promise<boolean>;
  saveReply(
    userId: string,
    assistantId: string,
    content: string,
    status: string,
  ): Promise<void>;
}

export interface UsageQuota {
  reserve(
    userId: string,
    kind: "chat" | "chat_feedback" | "chat_transcription",
    limit: number,
    reference: string,
  ): Promise<void>;
}
