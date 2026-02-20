import { assertOutputContains, cleanupAndExit } from "../utils/testing";

export async function testExportPuzzlesByDifficulty(): Promise<void> {
  const solvedPuzzleFile = "testPuzzles.csv";
  const maxExportPuzzles = "1";
  const outputDir = "test_exported_puzzles_by_difficulty";
  const expectedOutputFiles = [
    "novice_puzzles.ts",
    "amateur_puzzles.ts",
    "layman_puzzles.ts",
    "trainee_puzzles.ts",
    "protege_puzzles.ts",
    "professional_puzzles.ts",
    "pundit_puzzles.ts",
    "master_puzzles.ts",
    "grandmaster_puzzles.ts",
  ];

  await Bun.spawn({ cmd: ["rm", "-rf", outputDir] }).exited;

  const exportRun = Bun.spawn({
    cmd: ["sh", "-c", "echo 'y' | bun export_puzzles_by_difficulty.ts"],
    env: {
      ...process.env,
      SOLVED_PUZZLE_FILE: solvedPuzzleFile,
      MAX_EXPORT_PUZZLES: maxExportPuzzles,
      OUTPUT_DIR: outputDir,
    },
    stdout: "pipe",
  });
  const exitCode = await exportRun.exited;
  const output: string = await new Response(exportRun.stdout as ReadableStream<Uint8Array>).text();
  if (exitCode !== 0) {
    const err = exportRun.stderr ? await new Response(exportRun.stderr as ReadableStream<Uint8Array>).text() : "";
    await cleanupAndExit(`export_puzzles_by_difficulty.ts exited with code ${exitCode}\n${err}`);
  }

  const expectedConfigOutput: string[] = [
    `Solved Puzzle File: ${solvedPuzzleFile}`,
    `Max Export Puzzles: ${maxExportPuzzles}`,
    `Output Directory: ${outputDir}`,
    "Are these values correct? (y/n):",
    "[CH] Exported 9 difficulty files.",
  ];
  await assertOutputContains(output, expectedConfigOutput, "export_puzzles_by_difficulty.ts");

  for (const file of expectedOutputFiles) {
    const exists = await Bun.file(`${outputDir}/${file}`).exists();
    if (!exists) {
      await cleanupAndExit(`Expected exported file was not created: ${file}`);
    }
  }
  const typeFileExists = await Bun.file(`${outputDir}/puzzle.types.ts`).exists();
  if (!typeFileExists) {
    await cleanupAndExit(`Expected copied type file was not created: ${outputDir}/puzzle.types.ts`);
  }

  const noviceContent: string = await Bun.file(`${outputDir}/novice_puzzles.ts`).text();
  await assertOutputContains(
    noviceContent,
    [
      "import type { InputPuzzle } from \"./puzzle.types\";",
      "export const puzzles: InputPuzzle[] =",
    ],
    `${outputDir}/novice_puzzles.ts`
  );

  // Verify existing output directory causes early exit
  const secondRun = Bun.spawn({
    cmd: ["sh", "-c", "echo 'y' | bun export_puzzles_by_difficulty.ts"],
    env: {
      ...process.env,
      SOLVED_PUZZLE_FILE: solvedPuzzleFile,
      MAX_EXPORT_PUZZLES: maxExportPuzzles,
      OUTPUT_DIR: outputDir,
    },
    stdout: "pipe",
  });
  const secondExitCode = await secondRun.exited;
  const secondOutput: string = await new Response(secondRun.stdout as ReadableStream<Uint8Array>).text();
  if (secondExitCode === 0) {
    await cleanupAndExit("export_puzzles_by_difficulty.ts should exit non-zero when OUTPUT_DIR already exists.");
  }
  await assertOutputContains(
    secondOutput,
    [`[CH] Output directory already exists: ${outputDir}. Exiting.`],
    "export_puzzles_by_difficulty.ts second run"
  );

  await Bun.spawn({ cmd: ["rm", "-rf", outputDir] }).exited;

  console.log("Test Export Puzzles By Difficulty Logs:\n" + output + "\n");
}
