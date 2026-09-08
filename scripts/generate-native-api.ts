type Parameter = {
  name: string;
  in: string;
  schema: { type: string; enum?: string[] };
};
type Operation = {
  operationId: string;
  parameters?: Parameter[];
  requestBody?: { content: Record<string, { schema: { $ref: string } }> };
  responses: Record<string, { content?: Record<string, unknown> }>;
};

export function nativeSwiftGateway(document: unknown): string {
  const { paths } = document as {
    paths: Record<string, Record<string, Operation>>;
  };
  const operations = Object.entries(paths).flatMap(([path, methods]) =>
    path.startsWith("/ios/")
      ? Object.entries(methods)
          .filter(
            ([, operation]) =>
              operation.responses["200"]?.content?.["application/json"],
          )
          .map(([method, operation]) => {
            const components = path.slice(5).split("/");
            const conditions = components.flatMap((value, index) =>
              value.startsWith("{") ? [] : [`parts[${index}] == "${value}"`],
            );
            const pathInputs = components.flatMap((value, index) =>
              value.startsWith("{")
                ? [`${value.slice(1, -1)}: parts[${index}]`]
                : [],
            );
            const queryInputs = (operation.parameters ?? [])
              .filter((value) => value.in === "query")
              .map((value) => {
                const lookup = `query["${value.name}"]`;
                const conversion = value.schema.enum
                  ? `${lookup}.flatMap { .init(rawValue: $0) }`
                  : value.schema.type === "integer"
                    ? `${lookup}.flatMap(Int.init)`
                    : lookup;
                return `${value.name}: ${conversion}`;
              });
            const bodyName = operation.requestBody?.content[
              "application/json"
            ]?.schema.$ref
              .split("/")
              .at(-1);
            const inputs = [
              ...(pathInputs.length
                ? [`path: .init(${pathInputs.join(", ")})`]
                : []),
              ...(queryInputs.length
                ? [`query: .init(${queryInputs.join(", ")})`]
                : []),
              ...(bodyName
                ? [
                    `body: .json(try JSONDecoder().decode(Components.Schemas.${bodyName}.self, from: body ?? Data("{}".utf8)))`,
                  ]
                : []),
            ];
            return `        if method == "${method.toUpperCase()}" && parts.count == ${components.length} && ${conditions.join(" && ")} {
            let output = try await client.${operation.operationId}(.init(${inputs.join(", ")}))
            switch output {
            case .ok(let value): return try JSONEncoder().encode(value.body.json)
            case .default(_, let value):
                let error = try value.body.json.error
                throw NativeFailure(code: error.code, message: error.message)
            }
        }`;
          })
      : [],
  );
  return `import Foundation
import VeyloAPI

@MainActor
enum NativeGeneratedAPI {
    static func call(client: Client, method: String, path: String, body: Data?) async throws -> Data {
        guard let url = URLComponents(string: path) else { throw NativeFailure(code: "INVALID_ROUTE", message: "Invalid request.") }
        let parts = url.path.split(separator: "/").map(String.init)
        let query = Dictionary((url.queryItems ?? []).map { ($0.name, $0.value ?? "") }, uniquingKeysWith: { _, last in last })
${operations.join("\n")}
        throw NativeFailure(code: "INVALID_ROUTE", message: "This request is not in the API contract.")
    }
}
`;
}
