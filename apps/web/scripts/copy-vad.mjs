import { cp, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const target = path.resolve("public/vad");
await mkdir(target, { recursive: true });
const vadRoot = path.dirname(
  require.resolve("@ricky0123/vad-web/package.json"),
);
await cp(path.join(vadRoot, "dist"), target, { recursive: true });
const runtimeDist = path.dirname(
  require.resolve("onnxruntime-web", { paths: [vadRoot] }),
);
await cp(runtimeDist, target, { recursive: true });
