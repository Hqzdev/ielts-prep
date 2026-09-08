import { request } from "node:https";
import { rootCertificates } from "node:tls";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline";
import type { IncomingMessage } from "node:http";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../../domain/errors";
import { databaseError } from "../persistence/mapping";
import { recordMetric } from "../telemetry/context";

export interface GigaTransport {
  json(body: Record<string, unknown>): Promise<unknown>;
  stream(body: Record<string, unknown>): AsyncIterable<{ text?: string }>;
}

export class GigaHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
  }
}

export class GigaLease {
  constructor(private readonly db: SupabaseClient) {}
  async acquire() {
    const owner = randomUUID();
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      const { data, error } = await this.db.rpc("acquire_ai_lease", {
        p_provider: "gigachat",
        p_owner: owner,
      });
      databaseError(error);
      if (data) return owner;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new GigaHttpError(429, "AI_BUSY");
  }
  async release(owner: string) {
    const { error } = await this.db.rpc("release_ai_lease", {
      p_provider: "gigachat",
      p_owner: owner,
    });
    databaseError(error);
  }
}

export class GigaHttpsTransport implements GigaTransport {
  private static readonly tokens = new Map<
    string,
    Promise<{ token: string; expiresAt: number }>
  >();
  constructor(
    private readonly credentials: string,
    private readonly scope: string,
    private readonly lease: GigaLease,
    private readonly certificate?: () => string | undefined,
  ) {}

  async json(body: Record<string, unknown>): Promise<unknown> {
    const owner = await this.lease.acquire();
    try {
      const response = await this.authorized(body, AbortSignal.timeout(90000));
      const data = await this.readJSON(response);
      this.usage(data);
      return data;
    } finally {
      await this.lease.release(owner);
    }
  }

  async *stream(
    body: Record<string, unknown>,
  ): AsyncGenerator<{ text?: string }> {
    const owner = await this.lease.acquire();
    let response: IncomingMessage | undefined;
    try {
      response = await this.authorized(
        { ...body, stream: true },
        AbortSignal.timeout(90000),
      );
      const lines = createInterface({ input: response, crlfDelay: Infinity });
      let finished = false;
      let bytes = 0;
      for await (const line of lines) {
        bytes += Buffer.byteLength(line);
        if (bytes > 2000000)
          throw new GigaHttpError(502, "AI_RESPONSE_TOO_LARGE");
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") {
          finished = true;
          break;
        }
        const chunk = JSON.parse(payload);
        this.checkFinish(chunk);
        this.usage(chunk);
        const text = chunk.choices?.[0]?.delta?.content;
        if (typeof text === "string") yield { text };
      }
      if (!finished) throw new GigaHttpError(502, "AI_STREAM_INTERRUPTED");
    } finally {
      response?.destroy();
      await this.lease.release(owner);
    }
  }

  private async authorized(body: Record<string, unknown>, signal: AbortSignal) {
    if (!this.credentials)
      throw new AppError(
        "AI_UNAVAILABLE",
        "AI is not configured yet",
        "unavailable",
      );
    for (let attempt = 0; attempt < 2; attempt++) {
      const token = await this.token(signal);
      const response = await this.send(
        "https://api.giga.chat/v1/chat/completions",
        JSON.stringify(body),
        {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        signal,
      );
      if (response.statusCode === 401 && attempt === 0) {
        response.destroy();
        GigaHttpsTransport.tokens.delete(this.credentials);
        continue;
      }
      this.checkStatus(response);
      return response;
    }
    throw new GigaHttpError(401, "AI_AUTH_FAILED");
  }

  private async token(signal: AbortSignal): Promise<string> {
    let pending = GigaHttpsTransport.tokens.get(this.credentials);
    if (pending) {
      const cached = await pending;
      if (cached.expiresAt > Date.now() + 60000) return cached.token;
    }
    pending = this.fetchToken(signal);
    GigaHttpsTransport.tokens.set(this.credentials, pending);
    try {
      return (await pending).token;
    } catch (error) {
      GigaHttpsTransport.tokens.delete(this.credentials);
      throw error;
    }
  }

  private async fetchToken(signal: AbortSignal) {
    const response = await this.send(
      "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
      new URLSearchParams({ scope: this.scope }).toString(),
      {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + this.credentials,
        RqUID: randomUUID(),
      },
      signal,
    );
    this.checkStatus(response);
    const data = await this.readJSON(response);
    if (
      typeof data.access_token !== "string" ||
      typeof data.expires_at !== "number"
    )
      throw new GigaHttpError(502, "AI_AUTH_RESPONSE_INVALID");
    return { token: data.access_token, expiresAt: data.expires_at };
  }

  private send(
    url: string,
    body: string,
    headers: Record<string, string>,
    signal: AbortSignal,
  ): Promise<IncomingMessage> {
    return new Promise((resolve, reject) => {
      const certificate = this.certificate?.();
      const req = request(
        url,
        {
          method: "POST",
          headers,
          signal,
          ...(certificate ? { ca: [...rootCertificates, certificate] } : {}),
        },
        resolve,
      );
      req.on("error", () =>
        reject(new GigaHttpError(503, "AI_CONNECTION_FAILED")),
      );
      req.end(body);
    });
  }

  private checkStatus(response: IncomingMessage) {
    if ((response.statusCode ?? 500) >= 400) {
      response.destroy();
      throw new GigaHttpError(
        response.statusCode ?? 500,
        response.statusCode === 429 ? "AI_LIMIT" : "AI_PROVIDER_ERROR",
      );
    }
  }

  private async readJSON(response: IncomingMessage) {
    const chunks: Buffer[] = [];
    let bytes = 0;
    for await (const chunk of response) {
      const buffer = Buffer.from(chunk);
      bytes += buffer.byteLength;
      if (bytes > 2000000) {
        response.destroy();
        throw new GigaHttpError(502, "AI_RESPONSE_TOO_LARGE");
      }
      chunks.push(buffer);
    }
    const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    this.checkFinish(data);
    return data;
  }

  private checkFinish(data: { choices?: { finish_reason?: string }[] }) {
    const reason = data.choices?.[0]?.finish_reason;
    if (reason && !["stop", "function_call"].includes(reason))
      throw new GigaHttpError(
        422,
        reason === "blacklist"
          ? "AI_CONTENT_RESTRICTED"
          : "AI_RESPONSE_INCOMPLETE",
      );
  }

  private usage(data: {
    model?: string;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  }) {
    if (data.usage)
      recordMetric("gigachat_usage", {
        model: data.model ?? "unknown",
        inputTokens: data.usage.prompt_tokens ?? 0,
        outputTokens: data.usage.completion_tokens ?? 0,
      });
  }
}
