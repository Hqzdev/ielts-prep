import type { ChatReply } from "@veylo/backend/application/ports/conversations";

export function chatResponse(reply: ChatReply): Response {
  const encoder = new TextEncoder();
  let connected = true;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of reply.events) {
          if (!connected) continue;
          try {
            controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
          } catch {
            connected = false;
          }
        }
        if (connected) controller.close();
      } catch (error) {
        if (connected) controller.error(error);
      }
    },
    cancel() {
      connected = false;
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
