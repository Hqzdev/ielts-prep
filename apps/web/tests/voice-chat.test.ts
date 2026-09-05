import { beforeEach, describe, expect, it, vi } from "vitest";
import type { adminClient } from "@/server/supabase";
import type { Profile } from "@veylo/backend/domain/profile";
import type { VoiceChatService } from "@veylo/backend/application/services/voice-chat";
import type { LearningAiProvider } from "@veylo/backend/application/ports/ai";
import {
  createBackend,
  type BackendSettings,
} from "@veylo/backend/composition";
import { chatResponse } from "@/server/chat-response";
import { readAudio } from "@/server/read-audio";
import type { TutorService } from "@veylo/backend/application/services/tutor";
type VoiceChatProvider = Pick<
  LearningAiProvider,
  "greet" | "stream" | "transcribe" | "speak"
>;
import { WavCodec } from "@veylo/backend/domain/wav";
import { AppError } from "@veylo/backend/domain/errors";
import { preppyWelcome } from "@veylo/backend/ai/personality";

vi.mock("server-only", () => ({}));
vi.mock("@/server/config", () => ({
  config: {
    geminiKey: "test",
    dailyChatLimit: 30,
    appUrl: "http://localhost:3000",
    ttsModel: "test",
    voice: "test",
  },
}));
vi.mock("@/server/supabase", () => ({ adminClient: vi.fn() }));
type Row = Record<string, unknown>;
class DatabaseFixture {
  rows: Record<string, Row[]> = {
    chat_threads: [{ id: "thread", user_id: "owner" }],
    chat_messages: [
      {
        id: "message",
        thread_id: "thread",
        user_id: "owner",
        content: "Hello!",
        status: "complete",
        role: "assistant",
      },
    ],
    speech_assets: [],
  };
  writes: string[] = [];
  rpc = vi.fn(async () => ({ data: true, error: null }));
  upload = vi.fn(async () => ({ error: null }));
  createSignedUrl = vi.fn(async () => ({
    data: { signedUrl: "https://audio.example/signed" },
    error: null,
  }));
  storage = {
    from: vi.fn(() => ({
      upload: this.upload,
      createSignedUrl: this.createSignedUrl,
    })),
  };
  from(table: string) {
    let filters: [string, unknown][] = [];
    let values: Row[] | undefined;
    let patch: Row | undefined;
    const execute = () => {
      let rows = (this.rows[table] ?? []).filter((row) =>
        filters.every(([key, value]) => row[key] === value),
      );
      if (values) {
        this.writes.push(table);
        rows = values.map((row) => ({
          id: "new-thread",
          status: "complete",
          ...row,
        }));
        this.rows[table] = [...(this.rows[table] ?? []), ...rows];
        values = undefined;
      }
      if (patch) {
        rows.forEach((row) => Object.assign(row, patch));
        patch = undefined;
      }
      return { data: rows, error: null };
    };
    const query = {
      select: () => query,
      eq: (key: string, value: unknown) => {
        filters = [...filters, [key, value]];
        return query;
      },
      order: () => query,
      limit: () => query,
      insert: (input: Row | Row[]) => {
        values = Array.isArray(input) ? input : [input];
        return query;
      },
      upsert: (input: Row) => {
        values = [input];
        return query;
      },
      update: (input: Row) => {
        patch = input;
        return query;
      },
      maybeSingle: async () => {
        const result = execute();
        return { ...result, data: result.data[0] ?? null };
      },
      single: async () => {
        const result = execute();
        return { ...result, data: result.data[0] };
      },
      then: (resolve: (result: ReturnType<typeof execute>) => unknown) =>
        Promise.resolve(execute()).then(resolve),
    };
    return query;
  }
  get client() {
    return this as unknown as ReturnType<typeof adminClient>;
  }
}
let database: DatabaseFixture;
let provider: VoiceChatProvider;
let service: VoiceChatService;
let application: ReturnType<typeof createBackend>;
const settings: BackendSettings = {
  databaseReady: true,
  appUrl: "http://localhost:3000",
  betaLimit: 50,
  supabaseUrl: "http://localhost:54321",
  supabaseSecretKey: "test",
  geminiKey: "test",
  textModel: "test",
  audioModel: "test",
  ttsModel: "test",
  voice: "test",
  dailyChatLimit: 30,
  dailyAssessmentLimit: 5,
  canAssess: () => true,
};
async function startVoice(...args: Parameters<VoiceChatService["start"]>) {
  return chatResponse(await service.start(...args));
}
async function respondVoice(...args: Parameters<TutorService["respond"]>) {
  return chatResponse(await application.tutor.respond(...args));
}
async function transcribeVoice(
  userId: string,
  threadId: string,
  request: Request,
) {
  return service.transcribe(userId, threadId, await readAudio(request));
}
const audioRequest = (
  buffer = new WavCodec().encode(new Float32Array(16000)),
  headers = {},
) =>
  new Request("http://localhost:3000/api/chat/audio/transcribe?thread=thread", {
    method: "POST",
    headers: { "Content-Type": "audio/wav", ...headers },
    body: buffer,
  });
beforeEach(() => {
  database = new DatabaseFixture();
  provider = {
    greet: vi.fn(async function* () {
      yield { text: "Hi, I’m Preppy." };
    }) as unknown as VoiceChatProvider["greet"],
    stream: vi.fn(async function* () {
      yield { text: "What do you enjoy about it?" };
    }) as unknown as VoiceChatProvider["stream"],
    transcribe: vi.fn(async () => ({
      text: "I live in London.",
      segments: [],
      audioId: "audio",
    })),
    speak: vi.fn(
      async () =>
        new Uint8Array(new WavCodec().encode(new Float32Array(24000), 24000)),
    ),
  };
  application = createBackend(settings, database.client, {
    available: true,
    provider: () => provider as LearningAiProvider,
  });
  service = application.voice;
});

describe("voice audio authorization and validation", () => {
  it("speaks only the authored welcome, caches its audio, and creates no conversation", async () => {
    await service.welcome("owner");
    await service.welcome("owner");
    expect(provider.speak).toHaveBeenCalledExactlyOnceWith(preppyWelcome, {
      personality: "classic",
      explicit: false,
    });
    expect(database.rows.chat_messages).toHaveLength(1);
    expect(database.rows.chat_threads).toHaveLength(1);
    expect(database.upload).toHaveBeenCalledOnce();
  });
  it("rejects foreign threads before reading audio or calling Gemini", async () => {
    await expect(
      transcribeVoice("other", "thread", audioRequest()),
    ).rejects.toMatchObject({ kind: "not_found" });
    expect(provider.transcribe).not.toHaveBeenCalled();
  });
  it("transcribes mono 16 kHz audio entirely in memory", async () => {
    expect(await transcribeVoice("owner", "thread", audioRequest())).toEqual({
      text: "I live in London.",
    });
    expect(provider.transcribe).toHaveBeenCalledOnce();
    expect(database.writes).toEqual([]);
    expect(database.storage.from).not.toHaveBeenCalled();
  });
  it.each([
    "stereo",
    "rate",
    "length",
    "alignment",
    "format",
    "empty",
    "short",
    "long",
  ])("rejects invalid %s WAV", async (invalid) => {
    let buffer = new WavCodec().encode(new Float32Array(16000));
    const view = new DataView(buffer);
    if (invalid === "stereo") view.setUint16(22, 2, true);
    if (invalid === "rate")
      buffer = new WavCodec().encode(new Float32Array(24000), 24000);
    if (invalid === "length") view.setUint32(4, 2, true);
    if (invalid === "alignment") view.setUint16(32, 1, true);
    if (invalid === "format") view.setUint32(16, 18, true);
    if (invalid === "empty") buffer = new ArrayBuffer(0);
    if (invalid === "short")
      buffer = new WavCodec().encode(new Float32Array(100));
    if (invalid === "long")
      buffer = new WavCodec().encode(new Float32Array(960001));
    await expect(
      transcribeVoice("owner", "thread", audioRequest(buffer)),
    ).rejects.toBeInstanceOf(AppError);
    expect(provider.transcribe).not.toHaveBeenCalled();
  });
  it("checks origin, media type and streaming size without trusting Content-Length", async () => {
    await expect(
      transcribeVoice(
        "owner",
        "thread",
        audioRequest(undefined, { Origin: "https://foreign.example" }),
      ),
    ).rejects.toMatchObject({ kind: "forbidden" });
    await expect(
      transcribeVoice(
        "owner",
        "thread",
        audioRequest(undefined, { "Content-Type": "application/octet-stream" }),
      ),
    ).rejects.toMatchObject({ kind: "unsupported" });
    await expect(
      transcribeVoice(
        "owner",
        "thread",
        audioRequest(undefined, { "Content-Length": "9999999" }),
      ),
    ).rejects.toMatchObject({ kind: "too_large" });
    await expect(
      transcribeVoice(
        "owner",
        "thread",
        audioRequest(new ArrayBuffer(2000000)),
      ),
    ).rejects.toMatchObject({ kind: "too_large" });
  });
  it("reports Gemini failures without writing user audio", async () => {
    vi.mocked(provider.transcribe).mockRejectedValue(new Error("upstream"));
    await expect(
      transcribeVoice("owner", "thread", audioRequest()),
    ).rejects.toMatchObject({ code: "TRANSCRIPTION_FAILED" });
    expect(database.writes).toEqual([]);
  });
  it("checks thread ownership and message membership before TTS", async () => {
    await expect(
      service.speak("other", "thread", "message"),
    ).rejects.toMatchObject({ kind: "not_found" });
    await expect(
      service.speak("owner", "thread", "other-message"),
    ).rejects.toMatchObject({ kind: "not_found" });
    database.rows.chat_messages[0].thread_id = "other-thread";
    await expect(
      service.speak("owner", "thread", "message"),
    ).rejects.toMatchObject({ kind: "not_found" });
    expect(provider.speak).not.toHaveBeenCalled();
  });
  it.each(["streaming", "failed", "user", "empty"])(
    "does not speak %s messages",
    async (kind) => {
      const message = database.rows.chat_messages[0];
      if (kind === "user") message.role = "user";
      else if (kind === "empty") message.content = " ";
      else message.status = kind;
      await expect(
        service.speak("owner", "thread", "message"),
      ).rejects.toMatchObject({ kind: "conflict" });
      expect(provider.speak).not.toHaveBeenCalled();
    },
  );
  it("caches only assistant audio and returns a signed URL", async () => {
    expect(await service.speak("owner", "thread", "message")).toEqual({
      url: "https://audio.example/signed",
    });
    await service.speak("owner", "thread", "message");
    expect(provider.speak).toHaveBeenCalledOnce();
    expect(database.writes).toEqual(["speech_assets"]);
    expect(database.upload.mock.calls[0]).toBeDefined();
  });
  it("preserves text when TTS fails", async () => {
    vi.mocked(provider.speak).mockRejectedValue(new Error("upstream"));
    await expect(
      service.speak("owner", "thread", "message"),
    ).rejects.toMatchObject({ code: "TTS_FAILED" });
    expect(database.rows.chat_messages[0].content).toBe("Hello!");
    expect(database.writes).toEqual([]);
  });
});

describe("session stream", () => {
  const profile = {
    id: "owner",
    targetBand: 7,
    dailyMinutes: 30,
    studyDays: [1, 2],
  } as Profile;
  it("creates a thread and greeting without a fictional learner message", async () => {
    const result = await startVoice(profile);
    const events = (await result.text())
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(result.headers.get("content-type")).toContain(
      "application/x-ndjson",
    );
    expect(events.map((event) => event.type)).toEqual([
      "thread",
      "token",
      "done",
    ]);
    expect(
      database.rows.chat_messages
        .filter((message) => message.thread_id === "new-thread")
        .map((message) => message.role),
    ).toEqual(["assistant"]);
    expect(database.rpc).toHaveBeenCalledWith(
      "reserve_usage",
      expect.objectContaining({ p_kind: "chat", p_limit: 30 }),
    );
  });
  it("enforces the existing daily message limit", async () => {
    database.rpc.mockResolvedValueOnce({
      data: false,
      error: { message: "DAILY_LIMIT" },
    } as unknown as Awaited<ReturnType<typeof database.rpc>>);
    await expect(startVoice(profile)).rejects.toMatchObject({
      kind: "limited",
    });
    expect(provider.greet).not.toHaveBeenCalled();
  });
  it("persists partial text and retries an interrupted answer without adding learner messages", async () => {
    provider.greet = vi.fn(async function* () {
      yield { text: "Hi, I’m Preppy." };
      throw new Error("offline");
    }) as unknown as VoiceChatProvider["greet"];
    const response = await startVoice(profile);
    const events = (await response.text())
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    const id = events[0].assistantId;
    const message = database.rows.chat_messages.find((row) => row.id === id)!;
    expect(message.status).toBe("failed");
    expect(message.content).toContain("Preppy");
    provider.greet = vi.fn(async function* () {
      yield { text: "Hi, I’m Preppy. Where do you live?" };
    }) as unknown as VoiceChatProvider["greet"];
    await (
      await respondVoice(profile, {
        threadId: "new-thread",
        retryAssistantId: id,
      })
    ).text();
    expect(message.status).toBe("complete");
    expect(
      database.rows.chat_messages.filter((row) => row.id === id),
    ).toHaveLength(1);
    expect(database.rows.chat_messages.some((row) => row.role === "user")).toBe(
      false,
    );
  });
});

describe("Preppy personalities and expressions", () => {
  it("passes the selected personality to Gemini and persists only spoken text", async () => {
    provider.greet = vi.fn(async function* () {
      yield { text: '<face expression="lo' };
      yield {
        text: 've" position="center"/> Great work. What did you do today?',
      };
    }) as unknown as VoiceChatProvider["greet"];
    const preferences = { personality: "kind" as const, explicit: false };
    const response = await startVoice({ id: "owner" } as Profile, preferences);
    const events = (await response.text())
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(provider.greet).toHaveBeenCalledWith(preferences);
    expect(events.find((event) => event.type === "expression")).toEqual({
      type: "expression",
      expression: "love",
      position: "center",
    });
    expect(database.rows.chat_messages.at(-1)?.content).toBe(
      "Great work. What did you do today?",
    );
  });
  it("uses a separate speech cache for each personality", async () => {
    await service.speak("owner", "thread", "message", {
      personality: "kind",
      explicit: false,
    });
    await service.speak("owner", "thread", "message", {
      personality: "angry",
      explicit: false,
    });
    expect(provider.speak).toHaveBeenCalledTimes(2);
    expect(
      new Set(database.rows.speech_assets.map((row) => row.cache_key)).size,
    ).toBe(2);
  });
});

describe("conversation feedback boundaries", () => {
  const speech =
    "I live in a small town near the mountains and I have lived there for most of my life. I like walking with my friends because the air is fresh and the streets are quiet. My favourite place is the park where we meet after school and talk about our plans for the future.";
  it("checks ownership and short conversations before calling the provider", async () => {
    const feedbackProvider = { conversationFeedback: vi.fn() };
    const feedbackService = createBackend(settings, database.client, {
      available: true,
      provider: () =>
        ({ ...provider, ...feedbackProvider }) as unknown as LearningAiProvider,
    }).feedback;
    await expect(
      feedbackService.analyse("other", "thread"),
    ).rejects.toMatchObject({ kind: "not_found" });
    expect(await feedbackService.analyse("owner", "thread")).toEqual({
      status: "too_short",
    });
    expect(feedbackProvider.conversationFeedback).not.toHaveBeenCalled();
  });
  it("rejects invented quotations and accepts feedback grounded in learner text", async () => {
    database.rows.chat_messages.push({
      id: "user-reply",
      role: "user",
      content: speech,
      status: "complete",
      user_id: "owner",
      thread_id: "thread",
    });
    const feedback = {
      strengths: ["You give specific details about your town."],
      improvements: [
        {
          quote: "I lived on Mars.",
          correction: "I live on Mars.",
          explanation: "Use present tense.",
        },
      ],
      words: [],
    };
    const feedbackProvider = {
      conversationFeedback: vi.fn(async () => feedback),
    };
    const feedbackService = createBackend(settings, database.client, {
      available: true,
      provider: () =>
        ({ ...provider, ...feedbackProvider }) as unknown as LearningAiProvider,
    }).feedback;
    await expect(
      feedbackService.analyse("owner", "thread"),
    ).rejects.toMatchObject({ code: "INVALID_FEEDBACK" });
    feedback.improvements = [];
    expect(await feedbackService.analyse("owner", "thread")).toEqual({
      status: "ready",
      feedback,
    });
    expect(database.upload).not.toHaveBeenCalled();
  });
});
