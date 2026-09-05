import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const design = path.join(root, "packages/design-tokens");
const tokens = JSON.parse(
  await fs.readFile(path.join(design, "src/tokens.json"), "utf8"),
);
const check = process.argv.includes("--check");
const theme =
  ":root {\n" +
  Object.entries(tokens.properties)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join("\n") +
  "\n}\n";
const outputs = [
  { path: path.join(design, "src/theme.css"), content: Buffer.from(theme) },
];
for (const asset of tokens.assets)
  outputs.push({
    path: path.join(root, "apps/web", asset.web),
    content: await fs.readFile(path.join(design, "assets", asset.file)),
  });
for (const output of outputs) {
  if (check) {
    const current = await fs.readFile(output.path).catch(() => Buffer.alloc(0));
    if (!current.equals(output.content))
      throw new Error(
        `Design output is stale: ${path.relative(root, output.path)}`,
      );
  } else {
    await fs.mkdir(path.dirname(output.path), { recursive: true });
    await fs.writeFile(output.path, output.content);
  }
}
console.log(
  `Design: ${Object.keys(tokens.properties).length} tokens and ${tokens.assets.length} assets ${check ? "verified" : "generated"}.`,
);
