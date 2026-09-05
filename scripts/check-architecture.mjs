import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const configPath = ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");
const config = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const files = ["apps/web/src", "packages"].flatMap((directory) =>
  fs
    .readdirSync(directory, { recursive: true })
    .filter(
      (file) =>
        /\.(ts|tsx|mjs)$/.test(file) &&
        !/(^|\/)(node_modules|\.next|\.well-known)(\/|$)/.test(file),
    )
    .map((file) => path.resolve(directory, file)),
);
const graph = new Map();
const violations = [];
const relative = (file) => path.relative(root, file).replaceAll(path.sep, "/");
const layer = (file) =>
  relative(file).match(/^packages\/backend\/src\/([^/]+)\//)?.[1];
const allowedLayers = {
  domain: ["domain"],
  application: ["application", "domain"],
  infrastructure: ["infrastructure", "application", "domain"],
};

function inspectImport(file, specifier, typeOnly) {
  const ownLayer = layer(file);
  const resolved = ts.resolveModuleName(specifier, file, parsed.options, ts.sys)
    .resolvedModule?.resolvedFileName;
  const targetLayer = resolved ? layer(resolved) : undefined;
  const label = relative(file);
  const forbiddenLayer =
    ownLayer &&
    allowedLayers[ownLayer] &&
    targetLayer &&
    !allowedLayers[ownLayer].includes(targetLayer);
  const externalInCore =
    ["domain", "application"].includes(ownLayer) && (!resolved || !targetLayer);
  const backendToApp =
    ownLayer &&
    (specifier.startsWith("@/") ||
      (resolved && relative(resolved).startsWith("apps/")));
  const contractsToBackend =
    label.startsWith("packages/contracts/") &&
    (specifier.startsWith("@veylo/backend") || !!targetLayer);
  const uiToServer =
    label.startsWith("packages/ui-web/") &&
    targetLayer &&
    targetLayer !== "domain";
  const clientToServer =
    (/^(apps\/web\/src\/client\/|packages\/ui-web\/)/.test(label) ||
      /^(["\'])use client\1;/.test(fs.readFileSync(file, "utf8"))) &&
    !typeOnly &&
    (specifier.startsWith("@/server/") ||
      (targetLayer && targetLayer !== "domain"));
  if (
    forbiddenLayer ||
    externalInCore ||
    backendToApp ||
    contractsToBackend ||
    uiToServer ||
    clientToServer
  )
    violations.push(`${label}: forbidden dependency ${specifier}`);
  if (!typeOnly && resolved && files.includes(resolved))
    graph.get(file).push(resolved);
}

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  graph.set(file, []);
  const inspect = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const clause = ts.isImportDeclaration(node)
        ? node.importClause
        : undefined;
      const bindings = clause?.namedBindings;
      const typeOnly =
        node.isTypeOnly ||
        clause?.isTypeOnly ||
        (bindings &&
          ts.isNamedImports(bindings) &&
          bindings.elements.every((item) => item.isTypeOnly));
      inspectImport(file, node.moduleSpecifier.text, !!typeOnly);
    }
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        node.expression.getText(ast) === "require") &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    )
      inspectImport(file, node.arguments[0].text, false);
    if (
      ["domain", "application"].includes(layer(file)) &&
      ts.isIdentifier(node) &&
      [
        "process",
        "fetch",
        "Request",
        "Response",
        "ReadableStream",
        "document",
        "window",
        "Buffer",
      ].includes(node.text)
    )
      violations.push(
        `${relative(file)}: platform symbol ${node.text} in core`,
      );
    ts.forEachChild(node, inspect);
  };
  inspect(ast);
}

const visited = new Set();
const active = new Set();
function visit(file, trail) {
  if (active.has(file)) {
    violations.push(
      `Runtime dependency cycle: ${[...trail.slice(trail.indexOf(file)), file].map(relative).join(" -> ")}`,
    );
    return;
  }
  if (visited.has(file)) return;
  active.add(file);
  for (const dependency of graph.get(file) ?? [])
    visit(dependency, [...trail, file]);
  active.delete(file);
  visited.add(file);
}
for (const file of files) visit(file, []);
if (violations.length) {
  console.error([...new Set(violations)].join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `Architecture: ${files.length} modules checked; layers and runtime dependencies valid.`,
  );
