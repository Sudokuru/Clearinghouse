import { readFile, rename, rm } from "fs/promises";
import { DEFAULT_SOLVED_PUZZLES_FILE } from "./streams/StreamConstants";
import { COLORS, log, promptUserToConfirmValues } from "./utils/logs";

type DifficultyRange = {
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

function parseDifficultyRanges(markdown: string): DifficultyRange[] {
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

function toSnakeCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const maxExportPuzzlesEnv = process.env.MAX_EXPORT_PUZZLES;
const solvedPuzzleFile = process.env.SOLVED_PUZZLE_FILE ?? DEFAULT_SOLVED_PUZZLES_FILE;
const rangesFile = process.env.DIFFICULTY_RANGES_FILE ?? "DifficultyRanges.md";
const maxExportPuzzles = Number.parseInt(maxExportPuzzlesEnv ?? "", 10);
if (Number.isNaN(maxExportPuzzles) || maxExportPuzzles < 0) {
  console.error(`Invalid MAX_EXPORT_PUZZLES: '${maxExportPuzzlesEnv}'.`);
  process.exit(1);
}

const config = {
  "Solved Puzzle File": solvedPuzzleFile,
  "Difficulty Ranges File": rangesFile,
  "Max Export Puzzles": maxExportPuzzles,
};
promptUserToConfirmValues(config);

const rangesMarkdown = await readFile(rangesFile, "utf-8");
const difficultyRanges = parseDifficultyRanges(rangesMarkdown);
if (difficultyRanges.length === 0) {
  console.error(`No difficulty ranges found in ${rangesFile}.`);
  process.exit(1);
}

for (const range of difficultyRanges) {
  const outputFile = `${toSnakeCase(range.name)}_puzzles.ts`;
  log(
    `Exporting '${range.name}' puzzles (${range.minDifficulty} to ${range.maxDifficulty}) to ${outputFile}...`,
    COLORS.CYAN
  );

  const exportRun = Bun.spawn({
    cmd: ["sh", "-c", "echo 'y' | bun export_puzzles.ts"],
    env: {
      ...process.env,
      SOLVED_PUZZLE_FILE: solvedPuzzleFile,
      MIN_DIFFICULTY: range.minDifficulty.toString(),
      MAX_DIFFICULTY: range.maxDifficulty.toString(),
      MAX_EXPORT_PUZZLES: maxExportPuzzles.toString(),
    },
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await exportRun.exited;
  const exportOutput = await new Response(exportRun.stdout as ReadableStream<Uint8Array>).text();
  if (exitCode !== 0) {
    const errorOutput = await new Response(exportRun.stderr as ReadableStream<Uint8Array>).text();
    log(exportOutput, COLORS.RED);
    log(errorOutput, COLORS.RED);
    process.exit(1);
  }

  await rm(outputFile, { force: true });
  await rename("puzzles.ts", outputFile);
}

log(`Exported ${difficultyRanges.length} difficulty files.`, COLORS.GREEN);
