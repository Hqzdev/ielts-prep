import { describe, expect, it, vi } from "vitest";
import { apiData, createVeyloClient } from "../src/client";

describe("generated API transport", () => {
  it("resolves a fresh access token for every request", async () => {
    let token = "first";
    const headers: string[] = [];
    const client = createVeyloClient({
      baseUrl: "https://veylo.test/api/v1",
      accessToken: async () => token,
      fetch: async (request) => {
        headers.push(request.headers.get("Authorization")!);
        return Response.json([]);
      },
    });
    await client.GET("/chat/threads");
    token = "refreshed";
    await client.GET("/chat/threads");
    expect(headers).toEqual(["Bearer first", "Bearer refreshed"]);
  });

  it("preserves WAV bytes without JSON serialization", async () => {
    const bytes = new Uint8Array([82, 73, 70, 70, 0, 255]);
    const client = createVeyloClient({
      baseUrl: "https://veylo.test/api/v1",
      fetch: async (request) => {
        expect(request.headers.get("Content-Type")).toBe("audio/wav");
        expect(new Uint8Array(await request.arrayBuffer())).toEqual(bytes);
        expect(new URL(request.url).searchParams.get("thread")).toBe("owned");
        return Response.json({ text: "Hello" });
      },
    });
    const result = await apiData(
      client.POST("/chat/audio/transcribe", {
        params: { query: { thread: "owned" } },
        body: new Blob([bytes], { type: "audio/wav" }),
        headers: { "Content-Type": "audio/wav" },
      }),
    );
    expect(result.text).toBe("Hello");
  });

  it("reports revision conflicts with their request ID and never retries a write", async () => {
    const fetch = vi.fn(async () =>
      Response.json(
        { error: { code: "REVISION_CONFLICT", message: "Reload this draft" } },
        { status: 409, headers: { "X-Request-ID": "request-1" } },
      ),
    );
    const client = createVeyloClient({
      baseUrl: "https://veylo.test/api/v1",
      fetch,
    });
    await expect(
      client.PATCH("/attempts/{id}", {
        params: { path: { id: "attempt" } },
        body: { revision: 0, answer: { text: "", reading: {}, audioIds: [] } },
      }),
    ).rejects.toMatchObject({
      name: "ApiError",
      code: "REVISION_CONFLICT",
      status: 409,
      requestId: "request-1",
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("handles non-JSON infrastructure errors", async () => {
    const client = createVeyloClient({
      baseUrl: "https://veylo.test/api/v1",
      fetch: async () => new Response("Unavailable", { status: 502 }),
    });
    await expect(client.GET("/streak")).rejects.toMatchObject({
      code: "REQUEST_FAILED",
      status: 502,
    });
  });
});
