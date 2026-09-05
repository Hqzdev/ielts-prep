import { randomUUID } from "node:crypto";
import { apiOperations } from "@veylo/contracts/api";
import {
  withRequestContext,
  recordMetric,
} from "@veylo/backend/composition/observability";
import { failureStatus } from "./http-status";
import { chatResponse } from "./chat-response";
import type { ChatReply } from "@veylo/backend/application/ports/conversations";
import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { AppError } from "@veylo/backend/domain/errors";
import { config } from "./config";

export async function readBody<T>(
  request: Request,
  schema: ZodType<T>,
  maxBytes = 100000,
): Promise<T> {
  const origin = request.headers.get("origin");
  if (
    origin &&
    origin !== new URL(request.url).origin &&
    origin !== new URL(config.appUrl).origin
  )
    throw new AppError("INVALID_ORIGIN", "Invalid request origin", "forbidden");
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > maxBytes)
    throw new AppError(
      "BODY_TOO_LARGE",
      "The request is too large",
      "too_large",
    );
  try {
    return schema.parse(JSON.parse(body || "{}"));
  } catch (error) {
    if (error instanceof ZodError) throw error;
    throw new AppError("INVALID_JSON", "Invalid request");
  }
}

const routeNames = apiOperations.map((operation) => ({
  method: operation.method.toUpperCase(),
  pattern: new RegExp(
    "^" + operation.path.replace(/\{[^}]+\}/g, "[^/]+") + "$",
  ),
  name: operation.id,
}));

export function handle<T>(
  request: Request,
  operation: () => Promise<T>,
): Promise<Response> {
  const requestId = randomUUID();
  const path = new URL(request.url).pathname.replace(/^\/api(?:\/v1)?/, "");
  const name =
    routeNames.find(
      (route) => route.method === request.method && route.pattern.test(path),
    )?.name ?? (path === "/maintenance" ? "maintenance" : "unknown");
  return withRequestContext(requestId, async () => {
    const started = performance.now();
    let response: Response;
    try {
      const value = await operation();
      response =
        value && typeof value === "object" && "events" in value
          ? chatResponse(value as ChatReply)
          : value instanceof Response
            ? value
            : NextResponse.json(value);
    } catch (error) {
      response = errorResponse(error, requestId);
    }
    const durationMs = Math.round(performance.now() - started);
    response.headers.set("X-Request-ID", requestId);
    response.headers.set("Server-Timing", `app;dur=${durationMs}`);
    response.headers.set("Cache-Control", "private, no-store");
    recordMetric("http_request", {
      operation: name,
      method: request.method,
      status: response.status,
      success: response.ok,
      durationMs,
    });
    return response;
  });
}

function errorResponse(error: unknown, requestId: string) {
  if (error instanceof AppError)
    return NextResponse.json(
      { error: { code: error.code, message: error.message, requestId } },
      { status: failureStatus[error.kind] },
    );
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message:
            error.issues[0]?.message ?? "Check the information you entered",
          requestId,
        },
      },
      { status: 400 },
    );
  recordMetric("request_failed", {
    type: error instanceof Error ? error.name : "unknown",
  });
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Could not complete this action. Please try again.",
        requestId,
      },
    },
    { status: 500 },
  );
}
