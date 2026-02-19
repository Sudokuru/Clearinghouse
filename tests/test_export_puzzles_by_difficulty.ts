import { assertOutputContains, cleanupAndExit } from "../utils/testing";

export async function testExportPuzzlesByDifficulty(): Promise<void> {
  const solvedPuzzleFile = "testPuzzles.csv";
  const maxExportPuzzles = "1";
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

  for (const file of expectedOutputFiles) {
    await Bun.spawn({ cmd: ["rm", "-f", file] }).exited;
  }

  const exportRun = Bun.spawn({
    cmd: ["sh", "-c", "echo 'y' | bun export_puzzles_by_difficulty.ts"],
    env: {
      ...process.env,
      SOLVED_PUZZLE_FILE: solvedPuzzleFile,
      MAX_EXPORT_PUZZLES: maxExportPuzzles,
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
    "Difficulty Ranges File: DifficultyRanges.md",
    `Max Export Puzzles: ${maxExportPuzzles}`,
    "Are these values correct? (y/n):",
    "[CH] Exported 9 difficulty files.",
  ];
  await assertOutputContains(output, expectedConfigOutput, "export_puzzles_by_difficulty.ts");

  for (const file of expectedOutputFiles) {
    const exists = await Bun.file(file).exists();
    if (!exists) {
      await cleanupAndExit(`Expected exported file was not created: ${file}`);
    }
  }

  const noviceContent: string = await Bun.file("novice_puzzles.ts").text();
  await assertOutputContains(
    noviceContent,
    [
      "export interface InputPuzzle",
      "export const puzzles: InputPuzzle[] =",
    ],
    "novice_puzzles.ts"
  );

  for (const file of expectedOutputFiles) {
    await Bun.spawn({ cmd: ["rm", "-f", file] }).exited;
  }

  console.log("Test Export Puzzles By Difficulty Logs:\n" + output + "\n");
}
