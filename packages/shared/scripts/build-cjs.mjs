import { build } from "esbuild";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const baseDir = fileURLToPath(new URL("..", import.meta.url));
const outDir = join(baseDir, "dist-cjs");

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

await build({
  entryPoints: {
    "chatkit/session": join(baseDir, "src/chatkit/session.ts"),
    "chatkit/controllers": join(baseDir, "src/chatkit/controllers.ts")
  },
  outdir: outDir,
  format: "cjs",
  platform: "node",
  target: "node18",
  bundle: false,
  sourcemap: false,
  logLevel: "error",
  tsconfig: join(baseDir, "tsconfig.json"),
  outExtension: { ".js": ".cjs" },
  banner: {
    js: "const __import_meta_url = require('node:url').pathToFileURL(__filename).href;"
  },
  define: {
    "import.meta.url": "__import_meta_url"
  }
});

async function rewriteInternalImports(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await rewriteInternalImports(entryPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".cjs")) {
      continue;
    }

    let content = await readFile(entryPath, "utf8");
    const rewritten = content.replace(/\.js(?=["'])/g, ".cjs");

    if (rewritten !== content) {
      await writeFile(entryPath, rewritten, "utf8");
    }
  }
}

await rewriteInternalImports(outDir);

const indexPath = join(outDir, "index.cjs");
const indexContent = `"use strict";

const session = require("./chatkit/session.cjs");
const controllers = require("./chatkit/controllers.cjs");

const merged = {};
for (const mod of [session, controllers]) {
  Object.defineProperties(merged, Object.getOwnPropertyDescriptors(mod));
}

module.exports = merged;
`;

await writeFile(indexPath, indexContent);
