import { copyFile, rename, rm } from "fs/promises";
import { DEFAULT_SOLVED_PUZZLES_FILE } from "./streams/StreamConstants";
import { COLORS, log, promptUserToConfirmValues } from "./utils/logs";
import { DIFFICULTY_RANGES } from "./DifficultyRanges";
import { createNewOutputDirectory } from "./utils/export_output_dir";

function difficultyNameToSnakeCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const maxExportPuzzlesEnv = process.env.MAX_EXPORT_PUZZLES;
const solvedPuzzleFile = process.env.SOLVED_PUZZLE_FILE ?? DEFAULT_SOLVED_PUZZLES_FILE;
const outputDir = process.env.OUTPUT_DIR ?? "exported_puzzles_by_difficulty";
const maxExportPuzzles = Number.parseInt(maxExportPuzzlesEnv ?? "", 10);
if (Number.isNaN(maxExportPuzzles) || maxExportPuzzles < 0) {
  console.error(`Invalid MAX_EXPORT_PUZZLES: '${maxExportPuzzlesEnv}'.`);
  process.exit(1);
}

const config = {
  "Solved Puzzle File": solvedPuzzleFile,
  "Max Export Puzzles": maxExportPuzzles,
  "Output Directory": outputDir,
};
promptUserToConfirmValues(config);
if (!(await createNewOutputDirectory(outputDir))) {
  log(`Output directory already exists: ${outputDir}. Exiting.`, COLORS.RED);
  process.exit(1);
}
await copyFile("puzzle.types.ts", `${outputDir}/puzzle.types.ts`);

for (const range of DIFFICULTY_RANGES) {
  const outputFile = `${outputDir}/${difficultyNameToSnakeCase(range.name)}_puzzles.ts`;
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

log(`Exported ${DIFFICULTY_RANGES.length} difficulty files.`, COLORS.GREEN);
