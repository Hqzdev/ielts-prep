import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import openapiTS, { astToString } from "openapi-typescript";
import {
  openApiDocument,
  apiOperationCount,
} from "../packages/contracts/src/openapi";

const ast = await openapiTS(
  openApiDocument as unknown as Parameters<typeof openapiTS>[0],
  {
    defaultNonNullable: false,
    transform(schema) {
      if (schema.format === "binary")
        return ts.factory.createTypeReferenceNode("Blob");
    },
  },
);
const generated = astToString(ast);
const source = ts.createSourceFile(
  "schema.ts",
  generated,
  ts.ScriptTarget.Latest,
  true,
);
const printer = ts.createPrinter({ removeComments: true });
const outputs = new Map([
  [
    "packages/contracts/openapi.json",
    JSON.stringify(openApiDocument, null, 2) + "\n",
  ],
  ["packages/api-client/src/schema.ts", printer.printFile(source)],
]);
let stale = false;
for (const [file, content] of outputs) {
  if (process.argv.includes("--check")) {
    if ((await fs.readFile(file, "utf8").catch(() => "")) !== content) {
      console.error(`Generated API artifact is stale: ${file}`);
      stale = true;
    }
  } else {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, content);
  }
}
if (stale) process.exitCode = 1;
else
  console.log(
    `API: ${apiOperationCount} operations; OpenAPI and TypeScript ${process.argv.includes("--check") ? "verified" : "generated"}.`,
  );
