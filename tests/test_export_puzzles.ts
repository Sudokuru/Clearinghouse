import { assertOutputContains, cleanupAndExit } from "../utils/testing";

export async function testExportPuzzles(): Promise<void> {
  const solvedPuzzleFile: string = "testPuzzles.csv";

  const exportPuzzlesRun = Bun.spawn({
    cmd: ["sh", "-c", "echo 'y' | bun export_puzzles.ts"],
    env: {
      ...process.env,
      SOLVED_PUZZLE_FILE: solvedPuzzleFile,
    },
    stdout: "pipe",
  });
  const exitCode = await exportPuzzlesRun.exited;
  const exportPuzzlesOutput: string = await new Response(exportPuzzlesRun.stdout as ReadableStream<Uint8Array>).text();
  if (exitCode !== 0) {
    const err = exportPuzzlesRun.stderr ? await new Response(exportPuzzlesRun.stderr as ReadableStream<Uint8Array>).text() : "";
    await cleanupAndExit(`export_puzzles.ts exited with code ${exitCode}\n${err}`);
  }

  const expectedConfigOutput: string[] = [
    `Solved Puzzle File: ${solvedPuzzleFile}`,
    "Are these values correct? (y/n):",
  ];

  await assertOutputContains(exportPuzzlesOutput, expectedConfigOutput, "export_puzzles.ts");

  // Verify exported file contains expected puzzle data and type
  const fileContent: string = await Bun.file("puzzles.ts").text();
  await assertOutputContains(
    fileContent,
    [
      "export interface InputPuzzle",
      "export const puzzles: InputPuzzle[]",
      "\"p\": \"007500023850004060030102590700200010000710835080040076300620751915837042276000000\"",
      "\"s\": \"197568423852394167634172598763285914429716835581943276348629751915837642276451389\"",
      "\"d\": -15174",
    ],
    "puzzles.ts"
  );

  // Cleanup generated file
  await Bun.spawn({ cmd: ["rm", "-f", "puzzles.ts"] }).exited;

  console.log("Test Export Puzzles Logs:\n" + exportPuzzlesOutput + "\n");
}
