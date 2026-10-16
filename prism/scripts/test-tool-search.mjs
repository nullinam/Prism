import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const catalogText = await readFile(new URL("../src/catalog.ts", import.meta.url), "utf8");
const catalog = catalogText.split(/\r?\n/).filter((line) => line.trimStart().startsWith('{"id":')).map((line) => JSON.parse(line.trim().replace(/,$/, "")));
const source = await readFile(new URL("../src/toolSearch.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { searchTools, sortToolsAlphabetically } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

assert.equal(catalog.length, 150, "Expected the full 150-tool catalog.");
const alphabetical = sortToolsAlphabetically(catalog).map((tool) => tool.name);
assert.deepEqual(alphabetical, [...alphabetical].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })), "The catalog sort must be A–Z.");
assert.equal(searchTools(catalog, "").length, 150, "An empty query should list every tool.");

for (const [query, expected] of [
  ["make a photo smaller", ["Resize image", "Compress image"]],
  ["combine several PDFs into one", ["Merge PDFs"]],
  ["turn a picture into a PDF", ["Convert images to PDF"]],
]) {
  const names = searchTools(catalog, query).slice(0, 8).map((tool) => tool.name);
  assert(expected.some((name) => names.includes(name)), `Intent query “${query}” should surface one of: ${expected.join(", ")}. Got: ${names.join(", ")}`);
}

console.log("Tool search checks passed: 150 A–Z entries and 3 plain-language task queries.");
