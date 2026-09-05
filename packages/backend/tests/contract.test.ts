import { expect, expectTypeOf, it } from "vitest";
import type { z } from "zod";
import { chatEventSchema, apiOperations } from "../../contracts/src/api";
import { openApiDocument } from "../../contracts/src/openapi";
import type { ChatEvent } from "../src/application/ports/conversations";
import type { Attempt } from "../src/domain/attempt";
import type { Assessment } from "../src/domain/assessment";
import type { Task } from "../src/domain/task";
import {
  attemptSchema,
  assessmentSchema,
} from "../../contracts/src/schemas/responses";
import { taskSchema } from "../../contracts/src/schemas/task";

it("keeps public schemas assignable to the domain model", () => {
  expectTypeOf<z.output<typeof attemptSchema>>().toEqualTypeOf<Attempt>();
  expectTypeOf<z.output<typeof assessmentSchema>>().toEqualTypeOf<Assessment>();
  expectTypeOf<z.output<typeof taskSchema>>().toEqualTypeOf<Task>();
  expectTypeOf<z.output<typeof chatEventSchema>>().toEqualTypeOf<ChatEvent>();
});

it("gives every operation a unique stable name and request correlation headers", () => {
  expect(new Set(apiOperations.map((operation) => operation.id)).size).toBe(
    apiOperations.length,
  );
  expect(
    new Set(apiOperations.map((operation) => operation.method + operation.path))
      .size,
  ).toBe(apiOperations.length);
  expect(openApiDocument.openapi).toBe("3.1.0");
  for (const methods of Object.values(openApiDocument.paths)) {
    for (const operation of Object.values(methods)) {
      expect(operation).toMatchObject({
        responses: {
          "200": { headers: { "X-Request-ID": expect.any(Object) } },
          default: expect.any(Object),
        },
      });
    }
  }
});
