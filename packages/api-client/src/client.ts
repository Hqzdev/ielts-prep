import createClient from "openapi-fetch";
import type { paths } from "./schema";

export interface ApiClientOptions {
  baseUrl: string;
  accessToken?: () => Promise<string | null>;
  fetch?: (request: Request) => Promise<Response>;
  onSuccess?: (path: string, method: string) => void;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function createVeyloClient(options: ApiClientOptions) {
  const client = createClient<paths>({
    baseUrl: options.baseUrl,
    fetch: options.fetch,
    bodySerializer: (body: unknown) =>
      body instanceof Blob ? body : JSON.stringify(body),
  });
  client.use({
    async onRequest({ request }) {
      const token = await options.accessToken?.();
      if (token) request.headers.set("Authorization", `Bearer ${token}`);
      return request;
    },
    async onResponse({ request, response, schemaPath }) {
      if (!response.ok) {
        const result = await response
          .clone()
          .json()
          .catch(() => null);
        throw new ApiError(
          result?.error?.code ?? "REQUEST_FAILED",
          result?.error?.message ?? "Could not complete this action",
          response.status,
          response.headers.get("X-Request-ID") ?? undefined,
        );
      }
      options.onSuccess?.(schemaPath, request.method);
      return response;
    },
  });
  return client;
}

export async function apiData<T>(
  result: Promise<{ data?: T; response: Response }>,
): Promise<T> {
  const value = await result;
  if (value.data === undefined)
    throw new ApiError(
      "EMPTY_RESPONSE",
      "The server returned no response",
      value.response.status,
    );
  return value.data;
}
