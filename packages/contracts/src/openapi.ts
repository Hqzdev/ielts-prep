import { z } from "zod";
import { apiOperations } from "./api";
import { errorResponseSchema } from "./schemas/responses";

function normalizeNullable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeNullable);
  if (!value || typeof value !== "object") return value;
  const result = Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      normalizeNullable(child),
    ]),
  );
  const variants = result.anyOf as Record<string, unknown>[] | undefined;
  if (
    Array.isArray(variants) &&
    variants.length === 2 &&
    variants.some((variant) => variant.type === "null")
  ) {
    const other = variants.find((variant) => variant.type !== "null");
    if (other && typeof other.type === "string") {
      delete result.anyOf;
      return { ...result, ...other, type: [other.type, "null"] };
    }
  }
  return result;
}

function schema(value: z.ZodType, input = false) {
  const result = z.toJSONSchema(value, {
    io: input ? "input" : "output",
    target: "draft-2020-12",
  });
  delete result.$schema;
  return normalizeNullable(result);
}

const components: Record<string, unknown> = {
  ApiError: schema(errorResponseSchema),
};
const paths: Record<string, Record<string, unknown>> = {};
for (const operation of apiOperations) {
  const name = operation.id[0].toUpperCase() + operation.id.slice(1);
  const responseName = name + (operation.stream ? "Event" : "Response");
  components[responseName] = schema(operation.response);
  const parameters: Record<string, unknown>[] = [
    ...operation.path.matchAll(/\{([^}]+)\}/g),
  ].map((match) => ({
    name: match[1],
    in: "path",
    required: true,
    schema: { type: "string" },
  }));
  for (const [name, query] of Object.entries(operation.query ?? {}))
    parameters.push({
      name,
      in: "query",
      required: query.required ?? false,
      schema: schema(query.schema, true),
    });
  const responseHeaders = {
    "X-Request-ID": {
      description: "Opaque request correlation identifier.",
      schema: { type: "string" },
    },
  };
  const responseContent = operation.stream
    ? {
        "application/x-ndjson": {
          schema: { type: "string", format: "binary" },
          "x-item-schema": { $ref: `#/components/schemas/${responseName}` },
        },
      }
    : {
        "application/json": {
          schema: { $ref: `#/components/schemas/${responseName}` },
        },
      };
  const responses: Record<string, unknown> = {
    "200": {
      description: operation.stream
        ? "NDJSON event stream. A final done event reports persistence status."
        : "Successful response.",
      headers: responseHeaders,
      content: responseContent,
    },
    default: {
      description:
        "Error. Use the stable error code for recovery and show the message to the learner.",
      headers: responseHeaders,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ApiError" },
        },
      },
    },
  };
  const entry: Record<string, unknown> = {
    operationId: operation.id,
    description: operation.description,
    parameters,
    responses,
  };
  if (operation.body) {
    const requestName = name + "Request";
    components[requestName] = schema(operation.body, true);
    entry.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: `#/components/schemas/${requestName}` },
        },
      },
    };
  }
  if (operation.audio)
    entry.requestBody = {
      required: true,
      content: {
        "audio/wav": { schema: { type: "string", format: "binary" } },
      },
    };
  paths[operation.path] ??= {};
  paths[operation.path][operation.method] = entry;
}
export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Veylo API",
    version: "1.0.0",
    description:
      "Shared web and native application contract. Authenticate with a verified Supabase access token or the existing browser session. UTC instants are ISO 8601 strings; learning dates are YYYY-MM-DD in the profile's IANA timezone. Server errors use a stable code and request ID. Existing resource IDs and draft revisions define safe retries; creation operations explicitly document when a new resource would be created.",
  },
  servers: [{ url: "/api/v1" }],
  security: [{ bearerAuth: [] }, { browserSession: [] }],
  paths,
  components: {
    schemas: components,
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      browserSession: {
        type: "apiKey",
        in: "cookie",
        name: "sb-session",
        description:
          "Browser-only Supabase SSR session. The actual project-prefixed cookie name is managed by the Auth SDK and may be chunked; native clients use bearerAuth.",
      },
    },
  },
};

export const apiOperationCount = apiOperations.length;
