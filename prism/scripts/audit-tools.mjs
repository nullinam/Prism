import { readFile } from "node:fs/promises";

const catalogSource = await readFile(new URL("../src/catalog.ts", import.meta.url), "utf8");
const runnerSource = await readFile(new URL("../src/ToolRunner.tsx", import.meta.url), "utf8");
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

if (failures.length) {
  console.error(`PRISM tool audit found ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  const available = catalog.filter((tool) => tool.status === "ready" || tool.status === "limited").length;
  const development = catalog.length - available;
  console.log(`PRISM catalog audit passed: ${catalog.length} unique tools, explicit routes present, ${available} available, ${development} in development.`);
}
