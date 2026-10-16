import type { Tool } from "./catalog";

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "can", "could", "do", "for", "from", "get", "help",
  "i", "in", "is", "it", "make", "me", "my", "of", "on", "please", "the", "this",
  "to", "want", "with", "would",
]);

const RELATED_TERMS: Record<string, string[]> = {
  photo: ["image", "picture", "jpg", "jpeg", "png"],
  picture: ["image", "photo", "jpg", "jpeg", "png"],
  image: ["photo", "picture", "jpg", "jpeg", "png", "webp"],
  smaller: ["compress", "resize", "reduce", "shrink"],
  shrink: ["compress", "resize", "reduce", "smaller"],
  reduce: ["compress", "resize", "shrink", "smaller"],
  compress: ["smaller", "shrink", "reduce", "optimize"],
  optimize: ["compress", "reduce", "smaller"],
  convert: ["format", "transform", "change"],
  change: ["convert", "format", "transform"],
  format: ["convert", "png", "jpeg", "webp"],
  turn: ["rotate", "flip"],
  rotate: ["turn", "flip"],
  join: ["merge", "combine"],
  combine: ["merge", "join"],
  merge: ["combine", "join"],
  separate: ["split", "divide"],
  split: ["separate", "divide"],
  protect: ["password", "encrypt", "lock"],
  lock: ["password", "protect", "encrypt"],
  password: ["protect", "unlock", "encrypt"],
  unlock: ["password", "decrypt", "open"],
  remove: ["delete", "strip", "clean", "metadata"],
  strip: ["remove", "clean", "metadata"],
  clean: ["remove", "strip", "format"],
  metadata: ["exif", "remove", "privacy"],
  organize: ["sort", "rename", "files"],
  order: ["sort", "reorder", "sequence"],
  sort: ["order", "organize", "reorder"],
  duplicate: ["repeated", "unique", "remove"],
  repeated: ["duplicate", "unique"],
  detect: ["find", "identify", "inspect"],
  find: ["search", "detect", "locate"],
  qr: ["decode", "read", "scan", "barcode"],
  scan: ["qr", "decode", "read", "barcode"],
  calculate: ["calculator", "compute", "estimate"],
  calculator: ["calculate", "compute", "estimate"],
  schedule: ["plan", "calendar", "agenda"],
  plan: ["schedule", "checklist", "organize"],
  summarize: ["summary", "outline", "notes"],
  summary: ["summarize", "notes", "outline"],
};

function words(value: string): string[] {
  return value.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .match(/[\p{L}\p{N}]+/gu) ?? [];
}

export function sortToolsAlphabetically(items: Tool[]): Tool[] {
  return [...items].sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: "base" }) || left.id - right.id);
}

/** Local intent search. Expands common task wording and ranks titles above supporting copy. */
export function searchTools(items: Tool[], query: string): Tool[] {
  const sorted = sortToolsAlphabetically(items);
  const input = words(query).filter((word) => !STOP_WORDS.has(word));
  if (input.length === 0) return sorted;

  const normalizedQuery = words(query).join(" ");
  const intentBoost = new Map<string, number>();
  const boost = (name: string, score: number) => intentBoost.set(name, Math.max(intentBoost.get(name) ?? 0, score));
  if (/\b(?:pdf|pdfs)\b.*\b(?:image|images|photo|photos|picture|pictures)\b/.test(normalizedQuery)
      && /\b(?:to|into|as|extract|export)\b/.test(normalizedQuery)) {
    boost("Extract PDF images", 100);
  }
  if (/\b(?:image|images|photo|photos|picture|pictures)\b.*\b(?:pdf|pdfs)\b/.test(normalizedQuery)
      && /\b(?:to|into|as|convert|turn)\b/.test(normalizedQuery)) {
    boost("Convert images to PDF", 100);
  }
  if (/\b(?:combine|merge|join)\b/.test(normalizedQuery) && /\bpdfs?\b/.test(normalizedQuery)) {
    boost("Merge PDFs", 100);
  }
  if (/\b(?:smaller|shrink|reduce|compress)\b/.test(normalizedQuery)
      && /\b(?:image|images|photo|photos|picture|pictures)\b/.test(normalizedQuery)) {
    boost("Compress image", 100);
    boost("Resize image", 95);
  }

  const expanded = new Set(input);
  for (const word of input) {
    for (const related of RELATED_TERMS[word] ?? []) expanded.add(related);
    if (word.endsWith("ies") && word.length > 4) expanded.add(`${word.slice(0, -3)}y`);
    else if (word.endsWith("s") && word.length > 3) expanded.add(word.slice(0, -1));
    if (word.endsWith("ing") && word.length > 5) expanded.add(word.slice(0, -3));
  }

  const ranked = sorted.map((tool, index) => {
    const titleWords = new Set(words(tool.name));
    const detailWords = new Set(words(`${tool.category} ${tool.example} ${tool.beginner} ${tool.advanced} ${tool.preview}`));
    let score = intentBoost.get(tool.name) ?? 0;
    for (const word of expanded) {
      if (titleWords.has(word)) score += input.includes(word) ? 8 : 3;
      else if (detailWords.has(word)) score += input.includes(word) ? 2 : 1;
    }
    const phrase = input.join(" ");
    if (phrase.length > 2 && words(tool.name).join(" ").includes(phrase)) score += 10;
    return { tool, index, score };
  });

  const topScore = Math.max(0, ...ranked.map(({ score }) => score));
  const hasSpecificIntent = intentBoost.size > 0;
  const matches = ranked.filter(({ score }) => score > 0 && (!hasSpecificIntent || score >= topScore * 0.25));

  matches.sort((left, right) => right.score - left.score || left.index - right.index);
  return matches.map(({ tool }) => tool);
}

