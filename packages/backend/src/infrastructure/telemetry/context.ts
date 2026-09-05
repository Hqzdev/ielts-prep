import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

interface TraceContext {
  requestId: string;
  traceId: string;
}
const context = new AsyncLocalStorage<TraceContext>();

export function withRequestContext<T>(
  requestId: string,
  work: () => Promise<T>,
) {
  return context.run(
    { requestId, traceId: randomUUID().replaceAll("-", "") },
    work,
  );
}

export function recordMetric(
  event: string,
  values: Record<string, string | number | boolean>,
) {
  console.log(JSON.stringify({ event, ...context.getStore(), ...values }));
}

export async function measure<T>(
  operation: string,
  work: () => Promise<T>,
): Promise<T> {
  const started = performance.now();
  let success = false;
  try {
    const value = await work();
    success = true;
    return value;
  } finally {
    recordMetric("operation_completed", {
      operation,
      success,
      durationMs: Math.round(performance.now() - started),
    });
  }
}
