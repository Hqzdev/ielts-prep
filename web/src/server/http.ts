import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { AppError } from "@/domain/errors";
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
    throw new AppError("INVALID_ORIGIN", "Invalid request origin", 403);
  const body = await request.text();
  if (body.length > maxBytes)
    throw new AppError("BODY_TOO_LARGE", "The request is too large", 413);
  try {
    return schema.parse(JSON.parse(body || "{}"));
  } catch (error) {
    if (error instanceof ZodError) throw error;
    throw new AppError("INVALID_JSON", "Invalid request");
  }
}

export async function handle<T>(
  operation: () => Promise<T>,
): Promise<Response> {
  try {
    const value = await operation();
    return value instanceof Response ? value : NextResponse.json(value);
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    if (error instanceof ZodError)
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message:
              error.issues[0]?.message ?? "Check the information you entered",
          },
        },
        { status: 400 },
      );
    console.error(
      JSON.stringify({
        event: "request_failed",
        type: error instanceof Error ? error.name : "unknown",
      }),
    );
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Could not complete this action. Please try again.",
        },
      },
      { status: 500 },
    );
  }
}
