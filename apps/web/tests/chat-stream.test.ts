import { expect, it, vi } from "vitest";
import { chatResponse } from "@/server/chat-response";
import type { ChatEvent } from "@veylo/backend/application/ports/conversations";

it("continues saving the server reply when the browser disconnects", async () => {
  const release = Promise.withResolvers<void>();
  const saved = Promise.withResolvers<void>();
  const persist = vi.fn();
  async function* events(): AsyncGenerator<ChatEvent> {
    yield { type: "token", text: "first" };
    await release.promise;
    yield { type: "token", text: " second" };
    persist("first second");
    saved.resolve();
    yield { type: "done", status: "complete" };
  }
  const reader = chatResponse({ events: events() }).body!.getReader();
  expect((await reader.read()).done).toBe(false);
  await reader.cancel();
  release.resolve();
  await saved.promise;
  expect(persist).toHaveBeenCalledWith("first second");
});
