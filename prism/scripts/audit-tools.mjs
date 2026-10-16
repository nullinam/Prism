import { readFile } from "node:fs/promises";

const catalogSource = await readFile(new URL("../src/catalog.ts", import.meta.url), "utf8");
const runnerSource = await readFile(new URL("../src/ToolRunner.tsx", import.meta.url), "utf8");
const publicSources = await Promise.all(["../src/App.tsx", "../index.html", "../README.md"].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
const catalogRows = catalogSource.split(/\r?\n/).filter((line) => line.trimStart().startsWith('{"id":'));
const catalog = catalogRows.map((line, index) => {
  try {
    return JSON.parse(line.trim().replace(/,$/, ""));
  } catch (error) {
    throw new Error(`Catalog entry on source line ${index + 1} is not valid JSON: ${error}`);
  }
});

const failures = [];
const seenIds = new Set();
for (const tool of catalog) {
  if (seenIds.has(tool.id)) failures.push(`Duplicate tool id ${tool.id} (${tool.name}).`);
  seenIds.add(tool.id);
  if (!tool.name || !tool.category || !tool.trialLimit) failures.push(`Tool ${tool.id} is missing its name, category, or trial limit.`);
  if (!["ready", "limited", "in-progress", "planned"].includes(tool.status)) failures.push(`Tool ${tool.id} has an invalid status: ${tool.status}.`);
  if (!runnerSource.includes(`tool.id===${tool.id}`) && !runnerSource.includes(`tool.id === ${tool.id}`)) {
    failures.push(`Tool ${tool.id} (${tool.name}) has no explicit processing branch in ToolRunner.`);
  }
}

if (catalog.length !== 150) failures.push(`Expected 150 catalog entries, found ${catalog.length}.`);
for (let id = 1; id <= catalog.length; id += 1) if (!seenIds.has(id)) failures.push(`Missing catalog id ${id}.`);

const available = catalog.filter((tool) => tool.status === "ready" || tool.status === "limited");
const development = catalog.filter((tool) => tool.status === "in-progress" || tool.status === "planned");
const availabilityText = `currently lists ${available.length} available tools and ${development.length} in development`;
if (available.length !== 150 || development.length !== 0) failures.push(`Expected 150 available tools and none in development; ${availabilityText}.`);
if (development.some((tool) => !runnerSource.includes(`tool.id===${tool.id}`))) failures.push("Every in-development tool must have an explicit guarded runner route.");
for (const phrase of ["Explore 150 practical tools", "Browse all 150", "150 tools in the catalog", "all 150 tools have a local trial workflow", "150 private, on-device tools"]) {
  if ([...publicSources, catalogSource, runnerSource].some((source) => source.includes(phrase))) failures.push(`Remove stale availability claim: ${phrase}`);
}

if (failures.length) {
  console.error(`PRISM tool audit found ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`PRISM catalog audit passed: ${catalog.length} unique entries; ${availabilityText}. Route references are present; behavioral QA is tracked separately.`);
}

