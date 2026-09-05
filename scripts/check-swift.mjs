import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = path.join(root, "tools/api-compatibility");
const directory = path.join(root, ".local/api-compatibility");
const source = path.join(directory, "Sources/ContractCheck");
const versions = JSON.parse(
  await fs.readFile(path.join(fixture, "dependencies.json"), "utf8"),
);
await fs.mkdir(source, { recursive: true });
const manifest = `// swift-tools-version:6.1
import PackageDescription
let package = Package(
    name: "VeyloContractCheck",
    platforms: [.macOS(.v13), .iOS(.v16)],
    dependencies: [
${Object.entries(versions)
  .map(
    ([name, version]) =>
      `        .package(url: "https://github.com/apple/${name}", exact: "${version}")`,
  )
  .join(",\n")}
    ],
    targets: [
        .executableTarget(
            name: "ContractCheck",
            dependencies: [
                .product(name: "OpenAPIRuntime", package: "swift-openapi-runtime"),
                .product(name: "OpenAPIURLSession", package: "swift-openapi-urlsession")
            ],
            plugins: [.plugin(name: "OpenAPIGenerator", package: "swift-openapi-generator")]
        )
    ]
)
`;
await fs.writeFile(path.join(directory, "Package.swift"), manifest);
await fs.copyFile(
  path.join(root, "packages/contracts/openapi.json"),
  path.join(source, "openapi.json"),
);
await fs.copyFile(
  path.join(fixture, "ContractCheck.swift"),
  path.join(source, "ContractCheck.swift"),
);
await fs.writeFile(
  path.join(source, "openapi-generator-config.yaml"),
  "generate:\n  - types\n  - client\naccessModifier: internal\n",
);
const locked = await fs
  .readFile(path.join(fixture, "Package.resolved"))
  .catch(() => null);
if (locked)
  await fs.writeFile(path.join(directory, "Package.resolved"), locked);
else if (!process.argv.includes("--resolve"))
  throw new Error(
    "Missing Swift lockfile. Run pnpm swift:resolve when deliberately updating dependencies.",
  );

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "swift",
      ["run", "--package-path", directory, ...args],
      { stdio: "inherit", env: process.env },
    );
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Swift compatibility check failed (${code})`)),
    );
  });
}

await run([
  ...(process.argv.includes("--resolve") ? [] : ["--force-resolved-versions"]),
  "ContractCheck",
  path.join(root, "packages/design-tokens/src/tokens.json"),
  path.join(root, "packages/design-tokens/src/vey-motion.json"),
]);
if (process.argv.includes("--resolve"))
  await fs.copyFile(
    path.join(directory, "Package.resolved"),
    path.join(fixture, "Package.resolved"),
  );
