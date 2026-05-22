import { gzipSync } from "node:zlib";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { basename, extname, join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const distDir = join(root, "dist");
const assetDir = join(distDir, "assets");
const outputDir = join(root, "perf-reports");
const labelArg = process.argv.find(arg => arg.startsWith("--label="));
const label = labelArg ? labelArg.split("=")[1] : "latest";

const sizeKb = value => Math.round((value / 1024) * 100) / 100;

const collectFiles = async dir => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(path));
    else files.push(path);
  }
  return files;
};

const readAsset = async path => {
  const buffer = await readFile(path);
  const info = await stat(path);
  return {
    file: path.slice(distDir.length + 1),
    ext: extname(path).slice(1) || "none",
    bytes: info.size,
    gzipBytes: gzipSync(buffer).length,
  };
};

const files = await collectFiles(assetDir);
const assets = (await Promise.all(files.map(readAsset)))
  .sort((a, b) => b.bytes - a.bytes);
const indexHtml = await readFile(join(distDir, "index.html"), "utf8");
const initialAssets = [...indexHtml.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map(match => match[1].replace(/^\//, ""))
  .filter(item => item.startsWith("assets/"));

const report = {
  label,
  generatedAt: new Date().toISOString(),
  totals: {
    assetCount: assets.length,
    bytes: assets.reduce((sum, item) => sum + item.bytes, 0),
    gzipBytes: assets.reduce((sum, item) => sum + item.gzipBytes, 0),
  },
  initialAssets,
  largestAssets: assets.slice(0, 20),
  chunks: assets.filter(item => item.ext === "js").map(item => ({
    name: basename(item.file),
    bytes: item.bytes,
    gzipBytes: item.gzipBytes,
    initial: initialAssets.includes(item.file),
  })),
};

const markdown = [
  `# Build Report: ${label}`,
  "",
  `- Generated: ${report.generatedAt}`,
  `- Assets: ${report.totals.assetCount}`,
  `- Total: ${sizeKb(report.totals.bytes)} KiB`,
  `- Total gzip: ${sizeKb(report.totals.gzipBytes)} KiB`,
  "",
  "## Initial Assets",
  "",
  ...initialAssets.map(item => `- ${item}`),
  "",
  "## Largest Assets",
  "",
  "| Asset | Size KiB | Gzip KiB |",
  "|---|---:|---:|",
  ...report.largestAssets.map(item =>
    `| ${item.file} | ${sizeKb(item.bytes)} | ${sizeKb(item.gzipBytes)} |`,
  ),
  "",
  "## JavaScript Chunks",
  "",
  "| Chunk | Initial | Size KiB | Gzip KiB |",
  "|---|---:|---:|---:|",
  ...report.chunks.map(item =>
    `| ${item.name} | ${item.initial ? "yes" : "no"} | ${sizeKb(item.bytes)} | ${sizeKb(item.gzipBytes)} |`,
  ),
  "",
].join("\n");

await mkdir(outputDir, { recursive: true });
await writeFile(join(outputDir, `${label}.json`), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(join(outputDir, `${label}.md`), markdown);
await writeFile(join(outputDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(join(outputDir, "latest.md"), markdown);

console.log(`Build report written to ${join(outputDir, `${label}.md`)}`);
