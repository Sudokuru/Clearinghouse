import { readFile } from "fs/promises";

export type DifficultyRange = {
  name: string;
  minDifficulty: number;
  maxDifficulty: number;
};

function parseDifficulty(value: string): number {
  const parsed = Number.parseInt(value.replaceAll(",", "").trim(), 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid difficulty value: '${value}'`);
  }
  return parsed;
}

export function parseDifficultyRanges(markdown: string): DifficultyRange[] {
  const ranges: DifficultyRange[] = [];
  const lines = markdown.split("\n");

  for (const line of lines) {
    const match = line.match(/^\s*-\s*([^:]+):\s*(.+)\s*$/);
    if (!match) {
      continue;
    }

    const name = match[1].trim();
    const rawRange = match[2].trim();

    if (rawRange.toLowerCase().includes("through")) {
      const [from, to] = rawRange.split(/through/i).map((part) => part.trim());
      const left = parseDifficulty(from);
      const right = parseDifficulty(to);
      ranges.push({
        name,
        minDifficulty: Math.min(left, right),
        maxDifficulty: Math.max(left, right),
      });
      continue;
    }

    const value = parseDifficulty(rawRange);
    ranges.push({
      name,
      minDifficulty: value,
      maxDifficulty: value,
    });
  }

  return ranges;
}

export async function readDifficultyRanges(filePath: string): Promise<DifficultyRange[]> {
  const markdown = await readFile(filePath, "utf-8");
  return parseDifficultyRanges(markdown);
}

export function difficultyNameToSnakeCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
