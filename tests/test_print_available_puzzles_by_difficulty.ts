import { assertOutputContains, cleanupAndExit } from "../utils/testing";

export async function testPrintAvailablePuzzlesByDifficulty(): Promise<void> {
  const solvedPuzzleFile = "testPuzzles.csv";
  const rangesFile = "/tmp/testDifficultyRanges.md";
  const rangesContent = `- Easy: -16000 through -15000
- Hard: -20000 through -19000
`;
  await Bun.write(rangesFile, rangesContent);

  const run = Bun.spawn({
    cmd: ["sh", "-c", "echo 'y' | bun print_available_puzzles_by_difficulty.ts"],
    env: {
      ...process.env,
      SOLVED_PUZZLE_FILE: solvedPuzzleFile,
      DIFFICULTY_RANGES_FILE: rangesFile,
    },
    stdout: "pipe",
  });
  const exitCode = await run.exited;
  const output: string = await new Response(run.stdout as ReadableStream<Uint8Array>).text();
  if (exitCode !== 0) {
    const err = run.stderr ? await new Response(run.stderr as ReadableStream<Uint8Array>).text() : "";
    await cleanupAndExit(`print_available_puzzles_by_difficulty.ts exited with code ${exitCode}\n${err}`);
  }

  await assertOutputContains(
    output,
    [
      `Solved Puzzle File: ${solvedPuzzleFile}`,
      `Difficulty Ranges File: ${rangesFile}`,
      "Are these values correct? (y/n):",
      "[CH] Easy: 2",
      "[CH] Hard: 1",
      "[CH] Minimum puzzles available for any difficulty: 1",
    ],
    "print_available_puzzles_by_difficulty.ts"
  );

  await Bun.spawn({ cmd: ["rm", "-f", rangesFile] }).exited;
  console.log("Test Print Available Puzzles By Difficulty Logs:\n" + output + "\n");
}
